const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    workerProfile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkerProfile',
      required: true
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required.'],
      min: [1, 'Rating must be at least 1.'],
      max: [5, 'Rating cannot exceed 5.'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be a whole number.'
      }
    }
  },
  { timestamps: true }
);

reviewSchema.index({ workerProfile: 1, createdAt: -1 });
reviewSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
