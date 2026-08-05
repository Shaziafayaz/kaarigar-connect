const mongoose = require('mongoose');

const bookingStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];

const bookingSchema = new mongoose.Schema(
  {
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
    service: {
      type: String,
      required: [true, 'Service is required.'],
      trim: true,
      maxlength: [50, 'Service cannot exceed 50 characters.']
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required.']
    },
    description: {
      type: String,
      required: [true, 'Work description is required.'],
      trim: true,
      minlength: [10, 'Work description must contain at least 10 characters.'],
      maxlength: [1000, 'Work description cannot exceed 1000 characters.']
    },
    status: {
      type: String,
      enum: bookingStatuses,
      default: 'pending'
    },
    statusNote: {
      type: String,
      trim: true,
      maxlength: [500, 'Status note cannot exceed 500 characters.'],
      default: ''
    },
    acceptedAt: Date,
    rejectedAt: Date,
    completedAt: Date,
    cancelledAt: Date
  },
  { timestamps: true }
);

bookingSchema.index({ customer: 1, createdAt: -1 });
bookingSchema.index({ worker: 1, status: 1, preferredDate: 1 });

function isValidWorkerTransition(currentStatus, nextStatus) {
  return (currentStatus === 'pending' && ['accepted', 'rejected'].includes(nextStatus))
    || (currentStatus === 'accepted' && nextStatus === 'completed');
}

module.exports = {
  Booking: mongoose.model('Booking', bookingSchema),
  bookingStatuses,
  isValidWorkerTransition
};
