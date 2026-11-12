const express = require('express');
const {
  getMyProfile,
  saveMyProfile,
  getApprovedWorkerProfile
} = require('../controllers/workerController');
const { searchWorkers } = require('../controllers/workerDiscoveryController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', searchWorkers);
router.get('/me/profile', protect, authorize('worker'), getMyProfile);
router.put('/me/profile', protect, authorize('worker'), saveMyProfile);
router.get('/:workerId', getApprovedWorkerProfile);

module.exports = router;
