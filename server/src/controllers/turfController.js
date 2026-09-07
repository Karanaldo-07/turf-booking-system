const Turf = require('../models/Turf');

const pickTurfFields = (body = {}) => ({
  name: body.name,
  location: body.location,
  description: body.description,
  image: body.image,
  basePricePerHour: body.basePricePerHour,
  isActive: body.isActive,
  availableHours: body.availableHours
});

const getTurfs = async (_req, res) => {
  const turfs = await Turf.find({ isActive: true }).sort({ createdAt: -1 });
  res.json(turfs);
};

const adminGetTurfs = async (_req, res) => {
  const turfs = await Turf.find().sort({ createdAt: -1 });
  res.json(turfs);
};

const createTurf = async (req, res) => {
  const turf = await Turf.create(pickTurfFields(req.body));
  res.status(201).json(turf);
};

const updateTurf = async (req, res) => {
  const turf = await Turf.findByIdAndUpdate(
    req.params.id,
    { $set: pickTurfFields(req.body) },
    { new: true, runValidators: true }
  );
  if (!turf) return res.status(404).json({ message: 'Turf not found' });
  return res.json(turf);
};

const deleteTurf = async (req, res) => {
  const turf = await Turf.findByIdAndUpdate(
    req.params.id,
    { $set: { isActive: false } },
    { new: true }
  );
  if (!turf) return res.status(404).json({ message: 'Turf not found' });
  return res.json({ message: 'Turf deactivated successfully', turf });
};

module.exports = { getTurfs, adminGetTurfs, createTurf, updateTurf, deleteTurf };
