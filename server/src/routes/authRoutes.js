const express = require('express');
const { register, login, profile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(register));
router.post('/login', asyncHandler(login));
router.get('/profile', protect, asyncHandler(profile));
router.put('/profile', protect, asyncHandler(updateProfile));

module.exports = router;
