const mongoose = require('mongoose');
const { Booking, isValidWorkerTransition } = require('../models/Booking');
const { WorkerProfile, serviceCategories } = require('../models/WorkerProfile');
const asyncHandler = require('../utils/asyncHandler');

function requestError(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function parsePreferredDate(value) {
  if (typeof value !== 'string' || !value.trim()) throw requestError('Preferred date is required.');
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date <= new Date()) throw requestError('Preferred date must be in the future.');
  return date;
}

function validateDescription(value) {
  if (typeof value !== 'string' || value.trim().length < 10 || value.trim().length > 1000) {
    throw requestError('Work description must contain 10 to 1000 characters.');
  }
  return value.trim();
}

function validateStatusNote(value) {
  if (value === undefined) return '';
  if (typeof value !== 'string' || value.trim().length > 500) {
    throw requestError('Status note must be 500 characters or fewer.');
  }
  return value.trim();
}

function bookingDetailsQuery(filter) {
  return Booking.find(filter)
    .populate('customer', 'name phone')
    .populate('worker', 'name phone')
    .populate('workerProfile', 'category imageUrl hourlyRate serviceAreas');
}

const createBooking = asyncHandler(async (req, res) => {
  const { workerId, service } = req.body;
  if (!mongoose.isValidObjectId(workerId)) throw requestError('Choose a valid worker.');

  const normalizedService = typeof service === 'string' ? service.trim().toLowerCase() : '';
  if (!serviceCategories.includes(normalizedService)) throw requestError('Choose a valid service.');

  const workerProfile = await WorkerProfile.findOne({
    user: workerId,
    isApproved: true,
    availability: 'available'
  });

  if (!workerProfile) {
    return res.status(404).json({ success: false, message: 'This worker is not available for booking.' });
  }
  if (workerProfile.category !== normalizedService) {
    throw requestError('Selected service does not match this worker’s category.');
  }

  const booking = await Booking.create({
    customer: req.user._id,
    worker: workerProfile.user,
    workerProfile: workerProfile._id,
    service: normalizedService,
    preferredDate: parsePreferredDate(req.body.preferredDate),
    description: validateDescription(req.body.description)
  });

  const detailedBooking = await bookingDetailsQuery({ _id: booking._id }).findOne();
  return res.status(201).json({
    success: true,
    message: 'Booking request sent to the worker.',
    data: { booking: detailedBooking }
  });
});

const getCustomerBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingDetailsQuery({ customer: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, data: { bookings } });
});

const getWorkerBookings = asyncHandler(async (req, res) => {
  const bookings = await bookingDetailsQuery({ worker: req.user._id }).sort({ preferredDate: 1 });
  res.status(200).json({ success: true, data: { bookings } });
});

const getBooking = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.bookingId)) throw requestError('Invalid booking identifier.');
  const booking = await bookingDetailsQuery({ _id: req.params.bookingId }).findOne();

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (![booking.customer._id.toString(), booking.worker._id.toString()].includes(req.user._id.toString())) {
    return res.status(403).json({ success: false, message: 'You do not have access to this booking.' });
  }

  return res.status(200).json({ success: true, data: { booking } });
});

const cancelBooking = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.bookingId)) throw requestError('Invalid booking identifier.');
  const booking = await Booking.findOne({ _id: req.params.bookingId, customer: req.user._id });

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (!['pending', 'accepted'].includes(booking.status)) {
    return res.status(409).json({ success: false, message: 'Only pending or accepted bookings can be cancelled.' });
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  booking.statusNote = validateStatusNote(req.body.statusNote);
  await booking.save();

  return res.status(200).json({ success: true, message: 'Booking cancelled.', data: { booking } });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.bookingId)) throw requestError('Invalid booking identifier.');
  const { status } = req.body;
  const booking = await Booking.findOne({ _id: req.params.bookingId, worker: req.user._id });

  if (!booking) return res.status(404).json({ success: false, message: 'Booking not found.' });
  if (!isValidWorkerTransition(booking.status, status)) {
    return res.status(409).json({ success: false, message: `Cannot change a ${booking.status} booking to ${status}.` });
  }

  booking.status = status;
  booking.statusNote = validateStatusNote(req.body.statusNote);
  if (status === 'accepted') booking.acceptedAt = new Date();
  if (status === 'rejected') booking.rejectedAt = new Date();
  if (status === 'completed') booking.completedAt = new Date();
  await booking.save();

  return res.status(200).json({ success: true, message: `Booking ${status}.`, data: { booking } });
});

module.exports = {
  createBooking,
  getCustomerBookings,
  getWorkerBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus,
  parsePreferredDate,
  validateDescription
};
