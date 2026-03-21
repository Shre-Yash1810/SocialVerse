import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  post: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  text: string;
  parentComment?: mongoose.Types.ObjectId; // For threaded replies
  isReported: boolean;
  reportReason?: string;
}

const CommentSchema = new Schema<IComment>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
    isReported: { type: Boolean, default: false },
    reportReason: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IComment>('Comment', CommentSchema);
