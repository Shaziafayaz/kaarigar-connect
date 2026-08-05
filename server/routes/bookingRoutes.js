const express = require('express');
const {
  createBooking,
  getCustomerBookings,
  getWorkerBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('customer'), createBooking);
router.get('/customer', protect, authorize('customer'), getCustomerBookings);
router.get('/worker', protect, authorize('worker'), getWorkerBookings);
router.get('/:bookingId', protect, getBooking);
router.patch('/:bookingId/cancel', protect, authorize('customer'), cancelBooking);
router.patch('/:bookingId/status', protect, authorize('worker'), updateBookingStatus);

module.exports = router;
