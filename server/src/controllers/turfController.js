const Turf = require('../models/Turf');

const getTurfs = async (_req, res) => {
  const turfs = await Turf.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(turfs);
};

const adminGetTurfs = async (_req, res) => {
  const turfs = await Turf.find().sort({ createdAt: -1 });
  res.json(turfs);
};

const createTurf = async (req, res) => {
  const turf = await Turf.create(req.body);
  res.status(201).json(turf);
};

const updateTurf = async (req, res) => {
  const turf = await Turf.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!turf) return res.status(404).json({ message: 'Turf not found' });
  return res.json(turf);
};

module.exports = { getTurfs, adminGetTurfs, createTurf, updateTurf };
