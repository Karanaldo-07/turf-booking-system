const mongoose = require('mongoose');

let connectionPromise;

const connectDb = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;

  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not configured');
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
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
