import mongoose, { Schema, Document } from 'mongoose';

export interface IPost extends Document {
  author: mongoose.Types.ObjectId;
  type: 'Image' | 'Video' | 'Blog' | 'Moment';
  content: string; // URL for image/video or text for blog
  caption?: string;
  hashtags: string[];
  taggedUsers: mongoose.Types.ObjectId[];
  likes: mongoose.Types.ObjectId[];
  savedBy: mongoose.Types.ObjectId[];
  commentsCount: number;
  sharesCount: number;
  expiresAt?: Date; // For Moments (24h)
}

const PostSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Image', 'Video', 'Blog', 'Moment'], required: true },
    content: { type: String, required: true },
    caption: { type: String },
    hashtags: [{ type: String }],
    taggedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of users who liked
    savedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }], // Array of users who saved
    commentsCount: { type: Number, default: 0 },
    sharesCount: { type: Number, default: 0 },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

// TTL Index for Moments
PostSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IPost>('Post', PostSchema);
