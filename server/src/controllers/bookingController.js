const crypto = require('crypto');
const Razorpay = require('razorpay');
const Booking = require('../models/Booking');
const Turf = require('../models/Turf');

const BOOKING_HOLD_MINUTES = 15;

const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate('turf').sort({ createdAt: -1 });
  res.json(bookings);
};

const getAllBookings = async (_req, res) => {
  const bookings = await Booking.find().populate('user', 'name email phone').populate('turf').sort({ createdAt: -1 });
  res.json(bookings);
};

const getAvailability = async (req, res) => {
  const { turfId, date } = req.query;
  if (!turfId || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'Turf and date are required.' });

  const turf = await Turf.findById(turfId).select('availableHours isActive');
  if (!turf || !turf.isActive) return res.status(404).json({ message: 'Turf unavailable' });

  const now = new Date();
  const bookings = await Booking.find({
    turf: turfId,
    date,
    status: { $ne: 'cancelled' },
    $or: [{ status: 'approved' }, { status: 'pending', expiresAt: { $gt: now } }]
  }).select('startHour endHour');

  const bookedHours = new Set();
  bookings.forEach((booking) => {
    for (let hour = booking.startHour; hour < booking.endHour; hour += 1) bookedHours.add(hour);
  });

  const availableHours = [];
  for (let hour = turf.availableHours.start; hour < turf.availableHours.end; hour += 1) {
    if (!bookedHours.has(hour)) availableHours.push(hour);
  }

  res.json({ turfId, date, availableHours, bookedHours: [...bookedHours].sort((a, b) => a - b), openingHours: turf.availableHours });
};

const hasOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

const createBooking = async (req, res) => {
  const { turfId, date, startHour, endHour, notes } = req.body;
  const start = Number(startHour);
  const end = Number(endHour);

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !turfId || !Number.isInteger(start) || !Number.isInteger(end) || start >= end) return res.status(400).json({ message: 'Please select a valid date and time range' });

  const selectedDate = new Date(`${date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) return res.status(400).json({ message: 'Booking date cannot be in the past' });

  const turf = await Turf.findById(turfId);
  if (!turf || !turf.isActive) return res.status(404).json({ message: 'Turf unavailable' });
  if (start < turf.availableHours.start || end > turf.availableHours.end) return res.status(400).json({ message: `This turf is available from ${turf.availableHours.start}:00 to ${turf.availableHours.end}:00` });

  const now = new Date();
  await Booking.updateMany(
    { turf: turfId, date, status: 'pending', expiresAt: { $lte: now } },
    { $set: { status: 'cancelled', slotKeys: [], expiresAt: null } }
  );

  const conflicts = await Booking.find({
    turf: turfId,
    date,
    $or: [{ status: 'approved' }, { status: 'pending', expiresAt: { $gt: now } }]
  });
  if (conflicts.some((booking) => hasOverlap(start, end, booking.startHour, booking.endHour))) return res.status(409).json({ message: 'Selected slot is already booked. Please choose another time.' });

  const duration = end - start;
  const totalPrice = Math.round(duration * turf.basePricePerHour * 100) / 100;
  const slotKeys = Array.from({ length: duration }, (_, index) => `${turfId}:${date}:${start + index}`);

  let order;
  const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  const allowMockPayments = process.env.ALLOW_MOCK_PAYMENTS === 'true';

  if (razorpayConfigured) {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    try {
      order = await razorpay.orders.create({ amount: Math.round(totalPrice * 100), currency: 'INR', receipt: `booking_${Date.now()}` });
    } catch (_error) {
      return res.status(502).json({ message: 'Payment service is temporarily unavailable. Please try again.' });
    }
  } else if (allowMockPayments) {
    order = { id: `mock_order_${Date.now()}`, mock: true, amount: Math.round(totalPrice * 100), currency: 'INR' };
  } else {
    return res.status(503).json({ message: 'Online payments are not configured yet.' });
  }

  try {
    const booking = await Booking.create({ user: req.user._id, turf: turfId, date, startHour: start, endHour: end, duration, totalPrice, slotKeys, notes: typeof notes === 'string' ? notes.trim() : undefined, razorpayOrderId: order.id, status: 'pending', paymentStatus: 'pending', refundStatus: 'not_applicable', expiresAt: new Date(Date.now() + BOOKING_HOLD_MINUTES * 60 * 1000) });
    res.status(201).json({ booking, order, mockPayment: Boolean(order.mock), razorpayKeyId: process.env.RAZORPAY_KEY_ID || null });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'Selected slot was just booked by someone else. Please choose another time.' });
    throw error;
  }
};

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const confirmPayment = async (req, res) => {
  const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
  const booking = await Booking.findById(bookingId).populate('turf').populate('user', 'name email phone');

  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (String(booking.user._id) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Unauthorized booking access' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'This booking has been cancelled' });
  if (booking.paymentStatus === 'paid') return res.json({ message: `Booking confirmed for ${booking.turf.name}`, booking });
  if (booking.expiresAt && booking.expiresAt <= new Date()) {
    booking.status = 'cancelled';
    booking.slotKeys = [];
    await booking.save();
    return res.status(410).json({ message: 'This booking hold expired. Please select the slot again.' });
  }

  const isMock = booking.razorpayOrderId?.startsWith('mock_order_');
  if (isMock) {
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') return res.status(400).json({ message: 'Mock payment is disabled.' });
    if (razorpayOrderId !== booking.razorpayOrderId) return res.status(400).json({ message: 'Invalid payment order.' });
    booking.razorpayPaymentId = razorpayPaymentId || `mock_payment_${Date.now()}`;
  } else {
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || razorpayOrderId !== booking.razorpayOrderId) return res.status(400).json({ message: 'Missing or invalid payment details.' });
    if (!process.env.RAZORPAY_KEY_SECRET) return res.status(503).json({ message: 'Payment verification is not configured.' });

    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${booking.razorpayOrderId}|${razorpayPaymentId}`).digest('hex');
    if (!safeEqual(expectedSignature, razorpaySignature)) return res.status(400).json({ message: 'Payment verification failed.' });

    try {
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
      const payment = await razorpay.payments.fetch(razorpayPaymentId);
      const expectedAmount = Math.round(booking.totalPrice * 100);
      if (payment.order_id !== booking.razorpayOrderId || Number(payment.amount) !== expectedAmount || payment.currency !== 'INR') return res.status(400).json({ message: 'Payment amount or order verification failed.' });
      if (payment.status !== 'captured') return res.status(400).json({ message: `Payment is not captured (${payment.status}).` });
    } catch (_error) {
      return res.status(502).json({ message: 'Unable to verify payment status right now. Please try again.' });
    }

    booking.razorpayPaymentId = razorpayPaymentId;
  }

  booking.paymentStatus = 'paid';
  booking.refundStatus = 'not_applicable';
  booking.status = 'approved';
  booking.expiresAt = null;
  await booking.save();
  res.json({ message: `Booking confirmed for ${booking.turf.name}`, booking });
};

const refundPaidBooking = async (booking) => {
  if (booking.paymentStatus !== 'paid' || !booking.razorpayPaymentId) return;
  if (booking.refundStatus === 'processed') return;

  booking.refundStatus = 'pending';
  await booking.save();

  const isMock = booking.razorpayOrderId?.startsWith('mock_order_');
  if (isMock) {
    booking.paymentStatus = 'refunded';
    booking.refundStatus = 'processed';
    await booking.save();
    return;
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    booking.refundStatus = 'failed';
    await booking.save();
    throw new Error('Payment refund is not configured.');
  }

  try {
    const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const refund = await razorpay.payments.refund(booking.razorpayPaymentId, {
      amount: Math.round(booking.totalPrice * 100),
      notes: { booking_id: String(booking._id), reason: 'Customer booking cancellation' }
    });
    booking.razorpayRefundId = refund.id;
    booking.paymentStatus = 'refunded';
    booking.refundStatus = ['processed', 'created'].includes(refund.status) ? 'processed' : 'pending';
    await booking.save();
  } catch (error) {
    booking.refundStatus = 'failed';
    await booking.save();
    throw error;
  }
};

const cancelMyBooking = async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Booking is already cancelled' });

  if (booking.paymentStatus === 'paid') {
    try {
      await refundPaidBooking(booking);
    } catch (_error) {
      return res.status(502).json({ message: 'Refund could not be initiated. The booking was not cancelled.' });
    }
  }

  booking.status = 'cancelled';
  booking.slotKeys = [];
  booking.expiresAt = null;
  await booking.save();
  res.json({ message: booking.paymentStatus === 'refunded' ? 'Booking cancelled and refund initiated successfully.' : 'Booking cancelled successfully', booking });
};

const updateBookingStatus = async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'cancelled'].includes(status)) return res.status(400).json({ message: 'Invalid booking status' });
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });

  if (status === 'cancelled' && booking.paymentStatus === 'paid') {
    try {
      await refundPaidBooking(booking);
    } catch (_error) {
      return res.status(502).json({ message: 'Refund could not be initiated. The booking was not cancelled.' });
    }
  }

  booking.status = status;
  if (status === 'cancelled') {
    booking.slotKeys = [];
    booking.expiresAt = null;
  } else if (status === 'approved') {
    booking.expiresAt = null;
  }
  await booking.save();
  res.json(booking);
};

module.exports = { getMyBookings, getAllBookings, getAvailability, createBooking, confirmPayment, cancelMyBooking, updateBookingStatus };
