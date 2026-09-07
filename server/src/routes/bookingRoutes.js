const express = require('express');
const {
  getMyBookings,
  getAllBookings,
  getAvailability,
  createBooking,
  confirmPayment,
  cancelMyBooking,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/availability', asyncHandler(getAvailability));
router.get('/me', protect, asyncHandler(getMyBookings));
router.get('/admin/all', protect, adminOnly, asyncHandler(getAllBookings));
router.post('/', protect, asyncHandler(createBooking));
router.post('/confirm-payment', protect, asyncHandler(confirmPayment));
router.delete('/:id', protect, asyncHandler(cancelMyBooking));
router.put('/admin/:id/status', protect, adminOnly, asyncHandler(updateBookingStatus));

module.exports = router;
