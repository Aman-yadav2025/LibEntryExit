import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  student: mongoose.Types.ObjectId;
  title: string;
  body: string;
  read: boolean;
  type: 'entry' | 'exit' | 'flag' | 'general';
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ['entry', 'exit', 'flag', 'general'], default: 'general' },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);