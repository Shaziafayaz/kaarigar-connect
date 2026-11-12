const mongoose = require('mongoose');
const Booking = require('../models/Booking').Booking;
const Review = require('../models/Review');
const { WorkerProfile } = require('../models/WorkerProfile');
const asyncHandler = require('../utils/asyncHandler');

function requestError(message) {
  return Object.assign(new Error(message), { statusCode: 400 });
}

function validateReviewInput({ rating }) {
  const numericRating = Number(rating);
  if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
    throw requestError('Rating must be a whole number from 1 to 5.');
  }

  return { rating: numericRating };
}

function parsePagination(query) {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 10 : Number(query.limit);
  if (!Number.isInteger(page) || page < 1 || page > 100000) throw requestError('page must be a positive whole number.');
  if (!Number.isInteger(limit) || limit < 1 || limit > 50) throw requestError('limit must be between 1 and 50.');
  return { page, limit };
}

async function updateWorkerRating(workerProfileId) {
  const results = await Review.aggregate([
    { $match: { workerProfile: new mongoose.Types.ObjectId(workerProfileId) } },
    { $group: { _id: '$workerProfile', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }
  ]);

  const summary = results[0] || { averageRating: 0, totalReviews: 0 };
  await WorkerProfile.findByIdAndUpdate(workerProfileId, {
    averageRating: Math.round(summary.averageRating * 10) / 10,
    totalReviews: summary.totalReviews
  });
}

async function listReviews(workerProfileId, query) {
  const { page, limit } = parsePagination(query);
  const skip = (page - 1) * limit;
  const [reviews, total] = await Promise.all([
    Review.find({ workerProfile: workerProfileId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Review.countDocuments({ workerProfile: workerProfileId })
  ]);

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + reviews.length < total,
      hasPreviousPage: page > 1
    }
  };
}

const createReview = asyncHandler(async (req, res) => {
  const { bookingId } = req.body;
  if (!mongoose.isValidObjectId(bookingId)) throw requestError('Choose a valid completed booking.');
  const reviewInput = validateReviewInput(req.body);

  const booking = await Booking.findOne({
    _id: bookingId,
    customer: req.user._id,
    status: 'completed'
  });
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Completed booking not found.' });
  }

  const existingReview = await Review.exists({ booking: booking._id });
  if (existingReview) {
    return res.status(409).json({ success: false, message: 'You have already reviewed this booking.' });
  }

  const review = await Review.create({
    booking: booking._id,
    customer: req.user._id,
    worker: booking.worker,
    workerProfile: booking.workerProfile,
    ...reviewInput
  });
  await updateWorkerRating(booking.workerProfile);

  return res.status(201).json({ success: true, message: 'Review submitted.', data: { review } });
});

const getMyWorkerReviews = asyncHandler(async (req, res) => {
  const profile = await WorkerProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ success: false, message: 'Worker profile not found.' });

  const data = await listReviews(profile._id, req.query);
  return res.status(200).json({ success: true, data });
});

const getPublicWorkerReviews = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.workerId)) throw requestError('Invalid worker identifier.');
  const profile = await WorkerProfile.findOne({ user: req.params.workerId, isApproved: true });
  if (!profile) return res.status(404).json({ success: false, message: 'Approved worker profile not found.' });

  const data = await listReviews(profile._id, req.query);
  return res.status(200).json({ success: true, data });
});

module.exports = {
  createReview,
  getMyWorkerReviews,
  getPublicWorkerReviews,
  validateReviewInput,
  parsePagination,
  updateWorkerRating
};
