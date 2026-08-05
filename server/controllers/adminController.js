const mongoose = require('mongoose');
const User = require('../models/User');
const { WorkerProfile } = require('../models/WorkerProfile');
const { Booking, bookingStatuses } = require('../models/Booking');
const Review = require('../models/Review');
const { updateWorkerRating } = require('./reviewController');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

function requestError(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 20 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || page > 100000) throw requestError('page must be a positive whole number.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw requestError('limit must be between 1 and 50.');
  return { page, limit, skip: (page - 1) * limit };
}

function validateAdminBookingStatus(status) {
  if (!bookingStatuses.includes(status)) throw requestError('Choose a valid booking status.');
  return status;
}

function validateNote(statusNote) {
  if (statusNote === undefined) return '';
  if (typeof statusNote !== 'string' || statusNote.trim().length > 500) {
    throw requestError('Status note must be 500 characters or fewer.');
  }
  return statusNote.trim();
}

const adminLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw requestError('Email and password are required.');
  }

  const admin = await User.findOne({ email: email.toLowerCase().trim(), role: 'admin' }).select('+password');
  if (!admin || !admin.isActive || !(await admin.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
  }

  return res.status(200).json({
    success: true,
    message: 'Admin login successful.',
    data: {
      token: generateToken(admin),
      user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role }
    }
  });
});

const getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalWorkers, totalBookings, pendingBookings, totalReviews, pendingWorkerApprovals] = await Promise.all([
    User.countDocuments({ isActive: true }),
    User.countDocuments({ role: 'worker', isActive: true }),
    Booking.countDocuments(),
    Booking.countDocuments({ status: 'pending' }),
    Review.countDocuments(),
    WorkerProfile.countDocuments({ isApproved: false })
  ]);

  return res.status(200).json({
    success: true,
    data: { totalUsers, totalWorkers, totalBookings, pendingBookings, totalReviews, pendingWorkerApprovals }
  });
});

const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const role = req.query.role ? String(req.query.role).trim().toLowerCase() : undefined;
  if (role && !['customer', 'worker', 'admin'].includes(role)) throw requestError('Choose a valid user role.');
  const filter = role ? { role } : {};

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter)
  ]);
  return res.status(200).json({ success: true, data: { users }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

const listWorkerProfiles = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const approval = req.query.approval ? String(req.query.approval).trim().toLowerCase() : undefined;
  if (approval && !['pending', 'approved'].includes(approval)) throw requestError('approval must be pending or approved.');
  const filter = approval ? { isApproved: approval === 'approved' } : {};

  const [profiles, total] = await Promise.all([
    WorkerProfile.find(filter).populate('user', 'name email phone isActive').sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    WorkerProfile.countDocuments(filter)
  ]);
  return res.status(200).json({ success: true, data: { profiles }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

const setWorkerApproval = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.workerId)) throw requestError('Invalid worker identifier.');
  if (typeof req.body.isApproved !== 'boolean') throw requestError('isApproved must be true or false.');

  const profile = await WorkerProfile.findOneAndUpdate(
    { user: req.params.workerId },
    { isApproved: req.body.isApproved },
    { new: true, runValidators: true }
  ).populate('user', 'name email');
  if (!profile) return res.status(404).json({ success: false, message: 'Worker profile not found.' });

  return res.status(200).json({
    success: true,
    message: req.body.isApproved ? 'Worker approved.' : 'Worker approval removed.',
    data: { profile }
  });
});

const deactivateUser = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) throw requestError('Invalid user identifier.');
  if (req.params.userId === req.user._id.toString()) throw requestError('You cannot deactivate your own admin account.');

  const user = await User.findById(req.params.userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Admin accounts cannot be deactivated through this endpoint.' });

  user.isActive = false;
  await user.save();

  if (user.role === 'worker') {
    await WorkerProfile.findOneAndUpdate({ user: user._id }, { isApproved: false, availability: 'unavailable' });
  }

  return res.status(200).json({ success: true, message: 'User deactivated. Related records are retained for booking history.' });
});

const listBookings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const status = req.query.status ? String(req.query.status).trim().toLowerCase() : undefined;
  if (status && !bookingStatuses.includes(status)) throw requestError('Choose a valid booking status.');
  const filter = status ? { status } : {};

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('customer', 'name email phone')
      .populate('worker', 'name email phone')
      .populate('workerProfile', 'category imageUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Booking.countDocuments(filter)
  ]);
  return res.status(200).json({ success: true, data: { bookings }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

const updateBookingAsAdmin = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.bookingId)) throw requestError('Invalid booking identifier.');
  const status = validateAdminBookingStatus(req.body.status);
  const booking = await Booking.findById(req.params.bookingId);
  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });

  booking.status = status;
  booking.statusNote = validateNote(req.body.statusNote);
  const now = new Date();
  if (status === 'accepted') booking.acceptedAt = now;
  if (status === 'rejected') booking.rejectedAt = now;
  if (status === 'completed') booking.completedAt = now;
  if (status === 'cancelled') booking.cancelledAt = now;
  await booking.save();

  return res.status(200).json({ success: true, message: 'Booking updated by admin.', data: { booking } });
});

const listReviews = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const [reviews, total] = await Promise.all([
    Review.find().populate('customer', 'name email').populate('worker', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Review.countDocuments()
  ]);
  return res.status(200).json({ success: true, data: { reviews }, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
});

const deleteReview = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.reviewId)) throw requestError('Invalid review identifier.');
  const review = await Review.findByIdAndDelete(req.params.reviewId);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

  await updateWorkerRating(review.workerProfile);
  return res.status(200).json({ success: true, message: 'Review deleted and worker rating updated.' });
});

module.exports = {
  adminLogin,
  getDashboard,
  listUsers,
  listWorkerProfiles,
  setWorkerApproval,
  deactivateUser,
  listBookings,
  updateBookingAsAdmin,
  listReviews,
  deleteReview,
  parsePagination,
  validateAdminBookingStatus
};
