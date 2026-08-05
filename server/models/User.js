const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      minlength: [2, 'Name must contain at least 2 characters.'],
      maxlength: [60, 'Name cannot exceed 60 characters.']
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address.']
    },
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must contain at least 8 characters.'],
      select: false
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[0-9+\-()\s]{7,20}$/, 'Enter a valid phone number.']
    },
    role: {
      type: String,
      enum: ['customer', 'worker', 'admin'],
      default: 'customer'
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
