import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  reporter: mongoose.Types.ObjectId;
  target: mongoose.Types.ObjectId;
  reason: string;
  status: 'Pending' | 'Resolved' | 'Dismissed';
}

const ReportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    target: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'Resolved', 'Dismissed'], default: 'Pending' },
  },
  { timestamps: true }
);

export default mongoose.model<IReport>('Report', ReportSchema);
