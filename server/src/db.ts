import mongoose from 'mongoose';

// Cache connection across serverless warm invocations
let cached: typeof mongoose | null = null;
let pending: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<typeof mongoose> {
  if (cached && mongoose.connection.readyState === 1) return cached;

  if (!pending) {
    pending = mongoose.connect(process.env.MONGODB_URI!, { bufferCommands: false });
  }

  cached = await pending;
  return cached;
}
