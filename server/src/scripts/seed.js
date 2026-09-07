require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDb = require('../config/db');
const Turf = require('../models/Turf');
const User = require('../models/User');

const seed = async () => {
  await connectDb();

  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');

  if (!adminEmail || !adminPassword || adminPassword.length < 8) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD (minimum 8 characters) before running the seed script.');
  }

  await Turf.deleteMany();
  await User.deleteMany({ role: 'admin' });

  await Turf.insertMany([
    {
      name: 'Green Arena 5s',
      location: 'Downtown Stadium Road',
      description: 'Premium 5-a-side FIFA quality grass turf with floodlights.',
      image: 'https://images.unsplash.com/photo-1526232373132-0e4ee6f9f668?q=80&w=1200',
      basePricePerHour: 1200,
      availableHours: { start: 6, end: 23 }
    },
    {
      name: 'Champions Box',
      location: 'City Sports Complex',
      description: '7-a-side turf with spectator seating and changing rooms.',
      image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?q=80&w=1200',
      basePricePerHour: 1800,
      availableHours: { start: 7, end: 22 }
    }
  ]);

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  await User.create({
    name: 'Admin User',
    email: adminEmail,
    password: hashedPassword,
    role: 'admin'
  });

  console.log(`Seed complete. Admin account created for ${adminEmail}`);
  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error.message);
  process.exit(1);
});
