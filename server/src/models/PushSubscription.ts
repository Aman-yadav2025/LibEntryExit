import mongoose, { Document, Schema } from 'mongoose';

export interface IPushSubscription extends Document {
  user: mongoose.Types.ObjectId;
  subscription: object;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  subscription: { type: Schema.Types.Mixed, required: true },
});

export default mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
