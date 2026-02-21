const express = require('express');
const { getTurfs, adminGetTurfs, createTurf, updateTurf } = require('../controllers/turfController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', getTurfs);
router.get('/admin/all', protect, adminOnly, adminGetTurfs);
router.post('/', protect, adminOnly, createTurf);
router.put('/:id', protect, adminOnly, updateTurf);

module.exports = router;
