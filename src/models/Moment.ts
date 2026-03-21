import mongoose, { Schema, Document } from 'mongoose';

export interface IMoment extends Document {
  user: mongoose.Types.ObjectId;
  media: string;
  type: 'image' | 'video';
  viewers: mongoose.Types.ObjectId[];
  expiresAt: Date;
  createdAt: Date;
}

const MomentSchema = new Schema<IMoment>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    media: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    viewers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      index: { expires: 0 } // TTL index: documents expire at the time in expiresAt
    }
  },
  { timestamps: true }
);

export default mongoose.model<IMoment>('Moment', MomentSchema);
