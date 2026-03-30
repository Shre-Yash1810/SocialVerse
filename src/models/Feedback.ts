import mongoose, { Schema, Document } from 'mongoose';

export interface IFeedback extends Document {
  user: mongoose.Types.ObjectId;
  type: 'Feedback' | 'Issue';
  content: string;
  screenshot?: string;
  status: 'Pending' | 'Sighted' | 'Resolved' | 'Dismissed';
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
      type: String, 
      enum: ['Feedback', 'Issue'], 
      default: 'Feedback', 
      required: true 
    },
    content: { type: String, required: true },
    screenshot: { type: String },
    status: { 
      type: String, 
      enum: ['Pending', 'Sighted', 'Resolved', 'Dismissed'], 
      default: 'Pending' 
    },
  },
  { timestamps: true }
);

export default mongoose.model<IFeedback>('Feedback', FeedbackSchema);
