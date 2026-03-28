import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  targetType: 'User' | 'Post' | 'Blog' | 'Moment' | 'post' | 'blog' | 'moment';
  target: mongoose.Types.ObjectId;
  reason: string;
  screenshot?: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    targetType: { 
      type: String, 
      enum: ['User', 'Post', 'Blog', 'Moment', 'post', 'blog', 'moment'], 
      default: 'User', 
      required: true 
    },
    target: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    screenshot: { type: String },
    status: { type: String, enum: ['Pending', 'Resolved', 'Dismissed'], default: 'Pending' },
  },
  { timestamps: true }
);

export default mongoose.model<IReport>('Report', ReportSchema);
