const mongoose = require('mongoose');

const turfSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    image: { type: String },
    basePricePerHour: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    availableHours: {
      start: { type: Number, default: 6 },
      end: { type: Number, default: 23 }
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Turf', turfSchema);
