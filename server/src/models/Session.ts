import mongoose, { Document, Schema } from 'mongoose';

export interface IBelonging {
  description: string;
  type: 'laptop' | 'book' | 'bag' | 'device' | 'other';
  status: 'unchecked' | 'checked_by_guard' | 'acknowledged';
}

export interface ISession extends Document {
  student: mongoose.Types.ObjectId;
  belongings: IBelonging[];
  status: 'pending' | 'active' | 'exiting' | 'completed' | 'flagged';
  entryTime?: Date;
  exitTime?: Date;
  guard?: mongoose.Types.ObjectId;
  flagNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

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

const SessionSchema = new Schema<ISession>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    belongings: [BelongingSchema],
    status: {
      type: String,
      enum: ['pending', 'active', 'exiting', 'completed', 'flagged'],
      default: 'pending',
    },
    entryTime: Date,
    exitTime: Date,
    guard: { type: Schema.Types.ObjectId, ref: 'User' },
    flagNotes: String,
  },
  { timestamps: true }
);

export default mongoose.model<ISession>('Session', SessionSchema);
