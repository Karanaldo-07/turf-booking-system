const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const register = async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');
  const phone = String(req.body.phone || '').trim();

  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }
  if (phone.length > 20) {
    return res.status(400).json({ message: 'Phone number is too long.' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashedPassword, phone: phone || undefined });

  return res.status(201).json({
    token: generateToken({ id: user._id }),
    user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
  });
};

const login = async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const password = String(req.body.password || '');

  if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  return res.json({
    token: generateToken({ id: user._id }),
    user: { id: user._id, name: user.name, email: user.email, role: user.role, phone: user.phone }
  });
};

const profile = async (req, res) => res.json(req.user);

const updateProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  if (name && (name.length < 2 || name.length > 80)) return res.status(400).json({ message: 'Name must be between 2 and 80 characters.' });
  if (phone.length > 20) return res.status(400).json({ message: 'Phone number is too long.' });

  if (name) user.name = name;
  user.phone = phone || undefined;
  if (req.body.password) {
    const password = String(req.body.password);
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    user.password = await bcrypt.hash(password, 12);
  }
  await user.save();
  return res.json({ id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role });
};

module.exports = { register, login, profile, updateProfile };
