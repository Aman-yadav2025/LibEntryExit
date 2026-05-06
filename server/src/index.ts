import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './db';
import app from './app';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      // Small tweak: Make the log smarter based on where it is running!
      if (process.env.NODE_ENV === 'production') {
        console.log(`🚀 Server running live on port ${PORT}`);
      } else {
        console.log(`🚀 Server running locally at http://localhost:${PORT}`);
      }
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });