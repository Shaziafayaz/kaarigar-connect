require('dotenv').config();

const mongoose = require('mongoose');
const connectDatabase = require('../config/db');
const User = require('../models/User');

async function createAdmin() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error('Set ADMIN_NAME, ADMIN_EMAIL, and ADMIN_PASSWORD in .env before running this command.');
  }
  if (ADMIN_PASSWORD.length < 8) throw new Error('ADMIN_PASSWORD must contain at least 8 characters.');

  await connectDatabase();
  const email = ADMIN_EMAIL.toLowerCase().trim();
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error('An account with this email already exists.');

  const admin = await User.create({ name: ADMIN_NAME.trim(), email, password: ADMIN_PASSWORD, role: 'admin' });
  console.log(`Admin account created for ${admin.email}.`);
}

createAdmin()
  .catch((error) => {
    console.error(`Admin creation failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
