const mongoose = require('mongoose');

const serviceCategories = [
  'plumber',
  'electrician',
  'carpenter',
  'painter',
  'mechanic',
  'gardener',
  'tutor',
  'cleaner',
  'other'
];

const workerProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    category: {
      type: String,
      enum: serviceCategories,
      required: [true, 'A service category is required.']
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [800, 'Bio cannot exceed 800 characters.'],
      default: ''
    },
    skills: {
      type: [String],
      default: [],
      validate: {
        validator: (skills) => skills.length <= 15 && skills.every((skill) => skill.length >= 2 && skill.length <= 50),
        message: 'Provide up to 15 skills, each between 2 and 50 characters.'
      }
    },
    experienceYears: {
      type: Number,
      min: [0, 'Experience cannot be negative.'],
      max: [60, 'Experience cannot exceed 60 years.'],
      default: 0
    },
    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative.'],
      required: [true, 'Hourly rate is required.']
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'unavailable'],
      default: 'available'
    },
    serviceAreas: {
      type: [String],
      default: [],
      validate: {
        validator: (areas) => areas.length <= 10 && areas.every((area) => area.length >= 2 && area.length <= 80),
        message: 'Provide up to 10 service areas, each between 2 and 80 characters.'
      }
    },
    imageUrl: {
      type: String,
      default: ''
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      min: 0,
      default: 0
    }
  },
  { timestamps: true }
);

workerProfileSchema.index({ category: 1, availability: 1, isApproved: 1 });

module.exports = {
  WorkerProfile: mongoose.model('WorkerProfile', workerProfileSchema),
  serviceCategories
};
