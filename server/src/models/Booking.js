const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    turf: { type: mongoose.Schema.Types.ObjectId, ref: 'Turf', required: true },
    date: { type: String, required: true },
    startHour: { type: Number, required: true },
    endHour: { type: Number, required: true },
    duration: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    slotKeys: { type: [String], default: undefined },
    status: {
      type: String,
      enum: ['pending', 'approved', 'cancelled'],
      default: 'pending'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    notes: { type: String, trim: true, maxlength: 200 },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

// Each booking reserves every one-hour slot it covers. The unique multikey index
// makes concurrent booking attempts fail safely instead of relying only on a read check.
bookingSchema.index(
  { turf: 1, date: 1, slotKeys: 1 },
  { unique: true, partialFilterExpression: { slotKeys: { $exists: true, $ne: [] } } }
);
bookingSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: 'pending' } }
);
bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ turf: 1, date: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
