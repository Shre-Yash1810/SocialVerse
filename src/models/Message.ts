import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text?: string;
  media?: string;
  type: 'text' | 'image' | 'video' | 'post_share' | 'emoji';
  sharedPost?: mongoose.Types.ObjectId; // Reference to the shared post/byte/blog
  isRead: boolean;
  isDeleted: boolean; // For unsend
}

const MessageSchema = new Schema<IMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    media: { type: String },
    sharedPost: { type: Schema.Types.ObjectId, ref: 'Post' },
    type: { type: String, enum: ['text', 'image', 'video', 'post_share', 'emoji'], default: 'text' },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>('Message', MessageSchema);
