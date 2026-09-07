const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');

const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate('turf').sort({ createdAt: -1 });
  res.json(bookings);
};

const getAllBookings = async (_req, res) => {
  const bookings = await Booking.find().populate('user', 'name email phone').populate('turf').sort({ createdAt: -1 });
  res.json(bookings);
};

const hasOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const createBooking = async (req, res) => {
  const { turfId, date, startHour, endHour, notes } = req.body;
  const start = Number(startHour);
  const end = Number(endHour);

  if (!date || !turfId || !Number.isInteger(start) || !Number.isInteger(end) || start >= end) {
    return res.status(400).json({ message: 'Please select a valid date and time range' });
  }

  const selectedDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
    return res.status(400).json({ message: 'Booking date cannot be in the past' });
  }

  const turf = await Turf.findById(turfId);
  if (!turf || !turf.isActive) return res.status(404).json({ message: 'Turf unavailable' });
  if (start < turf.availableHours.start || end > turf.availableHours.end) {
    return res.status(400).json({ message: `This turf is available from ${turf.availableHours.start}:00 to ${turf.availableHours.end}:00` });
  }

  const conflicts = await Booking.find({ turf: turfId, date, status: { $ne: 'cancelled' } });
  if (conflicts.some((b) => hasOverlap(start, end, b.startHour, b.endHour))) {
    return res.status(409).json({ message: 'Selected slot is already booked. Please choose another time.' });
  }

  const duration = end - start;
  const totalPrice = duration * turf.basePricePerHour;
  let order;

  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    try {
      order = await razorpay.orders.create({
        amount: Math.round(totalPrice * 100),
        currency: 'INR',
        receipt: `booking_${Date.now()}`
      });
    } catch (_error) {
      return res.status(502).json({ message: 'Payment service is temporarily unavailable. Please try again.' });
    }
  } else {
    order = { id: `mock_order_${Date.now()}`, mock: true };
  }

  const booking = await Booking.create({
    user: req.user._id,
    turf: turfId,
    date,
    startHour: start,
    endHour: end,
    duration,
    totalPrice,
    notes: notes?.trim(),
    razorpayOrderId: order.id,
    status: 'pending',
    paymentStatus: 'pending'
  });

  res.status(201).json({
    booking,
    order,
    mockPayment: Boolean(order.mock),
    razorpayKeyId: process.env.RAZORPAY_KEY_ID || null
  });
};

const confirmPayment = async (req, res) => {
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const booking = await Booking.findById(bookingId).populate('turf').populate('user', 'name email');

  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized booking access' });
  }
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'This booking has been cancelled' });
  if (booking.paymentStatus === 'paid') return res.json({ message: `Booking confirmed for ${booking.turf.name}`, booking });

  const isMock = booking.razorpayOrderId?.startsWith('mock_order_');
  if (isMock) {
    if (process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_SECRET) {
      return res.status(400).json({ message: 'Mock payment is disabled while Razorpay is configured.' });
    }
    booking.razorpayPaymentId = razorpayPaymentId || `mock_payment_${Date.now()}`;
  } else {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || razorpayOrderId !== booking.razorpayOrderId) {
      return res.status(400).json({ message: 'Missing or invalid payment details.' });
    }
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');
    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed.' });
    }
    booking.razorpayPaymentId = razorpayPaymentId;
  }

  booking.paymentStatus = 'paid';
  booking.status = 'approved';
  await booking.save();

  res.json({ message: `Booking confirmed for ${booking.turf.name}`, booking });
};

const cancelMyBooking = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });

  booking.status = 'cancelled';
  await booking.save();
  res.json({ message: 'Booking cancelled successfully', booking });
};

const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'cancelled'].includes(status)) {
    return res.status(400).json({ message: 'Invalid booking status' });
  }
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  booking.status = status;
  await booking.save();
  res.json(booking);
};

module.exports = { getMyBookings, getAllBookings, createBooking, confirmPayment, cancelMyBooking, updateBookingStatus };
