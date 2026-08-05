const express = require('express');
const authRoutes = require('./routes/authRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kaarigar Connect server is running.',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
