import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  admins: mongoose.Types.ObjectId[];
  isGroup: boolean;
  name?: string; // For group chats
  groupPic?: string; // For group chats
  lastMessage?: mongoose.Types.ObjectId;
}

const ChatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isGroup: { type: Boolean, default: false },
    name: { type: String },
    groupPic: { type: String, default: '' },
    lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>('Chat', ChatSchema);
