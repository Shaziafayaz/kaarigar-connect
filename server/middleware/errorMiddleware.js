function notFound(req, res) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(error);

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({ success: false, message: 'Validation failed.', errors });
  }

  if (error.code === 11000) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'An unexpected server error occurred.'
  });
}

module.exports = { notFound, errorHandler };
