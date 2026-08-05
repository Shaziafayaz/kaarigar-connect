const mongoose = require('mongoose');

async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is not configured. Add it to the .env file.');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected successfully.');
}

module.exports = connectDatabase;
