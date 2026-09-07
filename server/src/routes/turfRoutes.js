const express = require('express');
const { getTurfs, adminGetTurfs, createTurf, updateTurf, deleteTurf } = require('../controllers/turfController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(getTurfs));
router.get('/admin/all', protect, adminOnly, asyncHandler(adminGetTurfs));
router.post('/', protect, adminOnly, asyncHandler(createTurf));
router.put('/:id', protect, adminOnly, asyncHandler(updateTurf));
router.delete('/:id', protect, adminOnly, asyncHandler(deleteTurf));

module.exports = router;
