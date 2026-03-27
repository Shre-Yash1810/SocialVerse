import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'MESSAGE' | 'WAVE';
  post?: mongoose.Types.ObjectId;
  moment?: mongoose.Types.ObjectId;
  chat?: mongoose.Types.ObjectId;
  isRead: boolean;
  extraInfo?: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['LIKE', 'COMMENT', 'FOLLOW', 'MENTION', 'MESSAGE', 'WAVE'], required: true },
    post: { type: Schema.Types.ObjectId, ref: 'Post' },
    moment: { type: Schema.Types.ObjectId, ref: 'Moment' },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat' },
    isRead: { type: Boolean, default: false },
    extraInfo: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<INotification>('Notification', NotificationSchema);
