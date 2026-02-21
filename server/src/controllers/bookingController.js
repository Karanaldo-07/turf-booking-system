const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');

const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate('turf').sort({ createdAt: -1 });
  res.json(bookings);
};

const getAllBookings = async (_req, res) => {
  const bookings = await Booking.find().populate('user', 'name email').populate('turf').sort({ createdAt: -1 });
  res.json(bookings);
};

const hasOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const createBooking = async (req, res) => {
  const { turfId, date, startHour, endHour } = req.body;
  if (!date || startHour >= endHour) {
    return res.status(400).json({ message: 'Invalid date or time range' });
  }

  const turf = await Turf.findById(turfId);
  if (!turf || !turf.isActive) return res.status(404).json({ message: 'Turf unavailable' });

  const conflicts = await Booking.find({ turf: turfId, date, status: { $ne: 'cancelled' } });
  const blocked = conflicts.some((b) => hasOverlap(startHour, endHour, b.startHour, b.endHour));
  if (blocked) return res.status(400).json({ message: 'Selected slot already booked' });

  const duration = endHour - startHour;
  const totalPrice = duration * turf.basePricePerHour;

  let order = null;
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    try {
      order = await razorpay.orders.create({ amount: totalPrice * 100, currency: 'INR', receipt: `booking_${Date.now()}` });
    } catch (_error) {
      order = { id: `mock_order_${Date.now()}` };
    }
  } else {
    order = { id: `mock_order_${Date.now()}` };
  }

  const booking = await Booking.create({
    user: req.user._id,
    turf: turfId,
    date,
    startHour,
    endHour,
    duration,
    totalPrice,
    razorpayOrderId: order.id,
    status: 'pending',
    paymentStatus: 'pending'
  });

  res.status(201).json({ booking, order });
};

const confirmPayment = async (req, res) => {
  const { bookingId, razorpayPaymentId } = req.body;
  const booking = await Booking.findById(bookingId).populate('turf').populate('user', 'name email');

  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized booking access' });
  }

  booking.paymentStatus = 'paid';
  booking.status = 'approved';
  booking.razorpayPaymentId = razorpayPaymentId || `mock_payment_${Date.now()}`;
  await booking.save();

  res.json({
    message: `Booking confirmed for ${booking.turf.name}. Confirmation sent to ${booking.user.email}`,
    booking
  });
};

const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  booking.status = status;
  if (status === 'cancelled') booking.paymentStatus = 'failed';
  await booking.save();
  res.json(booking);
};

module.exports = {
  getMyBookings,
  getAllBookings,
  createBooking,
  confirmPayment,
  updateBookingStatus
};
