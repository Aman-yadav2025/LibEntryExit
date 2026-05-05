import dotenv from 'dotenv';
dotenv.config();

import { connectDB } from './db';
import app from './app';

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
