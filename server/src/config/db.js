const mongoose = require('mongoose');

let connectionPromise;

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not configured');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    }).then(() => {
      console.log('MongoDB connected');
      return mongoose.connection;
    }).catch((error) => {
      connectionPromise = null;
      console.error('MongoDB connection failed:', error.message);
      throw error;
    });
  }

  return connectionPromise;
};

module.exports = connectDb;
