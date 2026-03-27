import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text?: string;
  media?: string;
  type: 'text' | 'image' | 'video' | 'post_share' | 'emoji';
  sharedPost?: mongoose.Types.ObjectId; // Reference to Post model
  sharedMoment?: mongoose.Types.ObjectId; // Reference to Moment model
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
    sharedMoment: { type: Schema.Types.ObjectId, ref: 'Moment' },
    type: { type: String, enum: ['text', 'image', 'video', 'post_share', 'emoji'], default: 'text' },
    isRead: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Optimize for chat history queries (find by chat, sort by createdAt)
MessageSchema.index({ chat: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
