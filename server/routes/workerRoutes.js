const express = require('express');
const {
  getMyProfile,
  saveMyProfile,
  uploadMyProfileImage,
  getApprovedWorkerProfile
} = require('../controllers/workerController');
const { protect, authorize } = require('../middleware/authMiddleware');
const uploadProfileImage = require('../middleware/uploadMiddleware');

const router = express.Router();

router.get('/me/profile', protect, authorize('worker'), getMyProfile);
router.put('/me/profile', protect, authorize('worker'), saveMyProfile);
router.post('/me/profile/image', protect, authorize('worker'), uploadProfileImage, uploadMyProfileImage);
router.get('/:workerId', getApprovedWorkerProfile);

module.exports = router;
