import mongoose, { Schema, Document, Types } from 'mongoose';

// 1. Update the Belonging interface to include _id
export interface IBelonging {
  _id?: Types.ObjectId; // Optional because Mongoose auto-generates it
  description: string;
  type: string;
  status: string;
}

// 2. Tell TypeScript that belongings is a special Mongoose DocumentArray
export interface ISession extends Document {
  student: Types.ObjectId | any;
  belongings: Types.DocumentArray<IBelonging>; // This line unlocks the .id() method!
  status: string;
  entryTime?: Date;
  exitTime?: Date;
  guard?: Types.ObjectId | any;
  flagNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Subdocument Schema
const BelongingSchema = new Schema<IBelonging>({
  _id: { type: Schema.Types.ObjectId, auto: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['laptop', 'book', 'bag', 'device', 'other'],
    default: 'other',
  },
  status: {
    type: String,
    enum: ['unchecked', 'checked_by_guard', 'acknowledged'],
    default: 'unchecked',
  }
});

// Parent Schema
const SessionSchema = new Schema<ISession>({
  student: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  belongings: [BelongingSchema],
  status: {
    type: String,
    enum: ['pending', 'active', 'exiting', 'completed', 'flagged'],
    default: 'pending',
  },
  entryTime: { type: Date },
  exitTime: { type: Date },
  guard: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  },
  flagNotes: { type: String }
}, { 
  timestamps: true 
});

export default mongoose.models.Session || mongoose.model<ISession>('Session', SessionSchema);