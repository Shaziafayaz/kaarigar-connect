const express = require('express');
const {
  createReview,
  getMyWorkerReviews,
  getPublicWorkerReviews
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, authorize('customer'), createReview);
router.get('/worker/me', protect, authorize('worker'), getMyWorkerReviews);
router.get('/worker/:workerId', getPublicWorkerReviews);

module.exports = router;
