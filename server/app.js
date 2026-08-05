const express = require('express');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kaarigar Connect server is running.',
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = app;
