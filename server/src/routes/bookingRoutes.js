const express = require('express');
const {
  getMyBookings,
  getAllBookings,
  createBooking,
  confirmPayment,
  updateBookingStatus
} = require('../controllers/bookingController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me', protect, getMyBookings);
router.get('/admin/all', protect, adminOnly, getAllBookings);
router.post('/', protect, createBooking);
router.post('/confirm-payment', protect, confirmPayment);
router.put('/admin/:id/status', protect, adminOnly, updateBookingStatus);

module.exports = router;
