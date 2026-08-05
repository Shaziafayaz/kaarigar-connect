const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');

function validateRegistration({ name, email, password, phone, role }) {
  const errors = [];

  if (typeof name !== 'string' || name.trim().length < 2) errors.push('Name must contain at least 2 characters.');
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) errors.push('Enter a valid email address.');
  if (typeof password !== 'string' || password.length < 8) errors.push('Password must contain at least 8 characters.');
  if (phone && (typeof phone !== 'string' || !/^[0-9+\-()\s]{7,20}$/.test(phone))) errors.push('Enter a valid phone number.');
  if (role && !['customer', 'worker'].includes(role)) errors.push('You can register only as a customer or worker.');

  return errors;
}

function userResponse(user, token) {
  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role
    }
  };
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  const errors = validateRegistration({ name, email, password, phone, role });

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: 'Registration validation failed.', errors });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? phone.trim() : undefined,
    role: role || 'customer'
  });

  return res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: userResponse(user, generateToken(user))
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.comparePassword(password)) || !user.isActive) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  return res.status(200).json({
    success: true,
    message: 'Login successful.',
    data: userResponse(user, generateToken(user))
  });
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role
      }
    }
  });
});

function logout(req, res) { // JWT is stateless; the client discards its token.
  res.status(200).json({ success: true, message: 'Logged out successfully. Remove the token from client storage.' });
}

module.exports = { register, login, getCurrentUser, logout };
