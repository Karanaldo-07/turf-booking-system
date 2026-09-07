const mongoose = require('mongoose');

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    location: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 1000 },
    image: { type: String, trim: true, maxlength: 1000 },
    basePricePerHour: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
    availableHours: {
      start: { type: Number, min: 0, max: 23, default: 6 },
      end: { type: Number, min: 1, max: 24, default: 23 }
    }
  },
  { timestamps: true }
);

turfSchema.pre('validate', function validateHours(next) {
  if (this.availableHours.start >= this.availableHours.end) {
    return next(new Error('Turf opening time must be before closing time.'));
  }
  return next();
});

module.exports = mongoose.model('Turf', turfSchema);
