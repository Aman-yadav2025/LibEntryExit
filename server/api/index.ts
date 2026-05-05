// Vercel serverless entry point — all routes rewrote here
import { connectDB } from '../src/db';
import app from '../src/app';

export default async function handler(req: any, res: any) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error: any) {
    console.error('Vercel API Crash:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
