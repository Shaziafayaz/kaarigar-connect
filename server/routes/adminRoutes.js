const express = require('express');
const {
  adminLogin,
  getDashboard,
  listUsers,
  listWorkerProfiles,
  setWorkerApproval,
  deactivateUser,
  listBookings,
  updateBookingAsAdmin,
  listReviews,
  deleteReview
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', adminLogin);

router.use(protect, authorize('admin'));
router.get('/dashboard', getDashboard);
router.get('/users', listUsers);
router.delete('/users/:userId', deactivateUser);
router.get('/workers', listWorkerProfiles);
router.patch('/workers/:workerId/approval', setWorkerApproval);
router.get('/bookings', listBookings);
router.patch('/bookings/:bookingId/status', updateBookingAsAdmin);
router.get('/reviews', listReviews);
router.delete('/reviews/:reviewId', deleteReview);

module.exports = router;
