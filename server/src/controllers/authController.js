const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const register = async (req, res) => {
  const { name, email, password, phone } = req.body;
  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashedPassword, phone });

  return res.status(201).json({
    token: generateToken({ id: user._id }),
    user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  return res.json({
    token: generateToken({ id: user._id }),
    user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
  });
};

const profile = async (req, res) => {
  return res.json(req.user);
};

const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.name = req.body.name || user.name;
  user.phone = req.body.phone || user.phone;
  if (req.body.password) user.password = await bcrypt.hash(req.body.password, 10);
  await user.save();
  return res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });
};

module.exports = { register, login, profile, updateProfile };
