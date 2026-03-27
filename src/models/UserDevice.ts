import mongoose, { Schema, Document } from 'mongoose';

export interface IUserDevice extends Document {
  user: mongoose.Types.ObjectId;
  deviceId: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  lastSeen: Date;
}

const UserDeviceSchema = new Schema<IUserDevice>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    deviceId: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], required: true },
      coordinates: { type: [Number], required: true },
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound index for efficient lookup and geospatial queries
UserDeviceSchema.index({ user: 1, deviceId: 1 }, { unique: true });
UserDeviceSchema.index({ location: '2dsphere' });

// TTL index to automatically remove devices not seen for 24 hours
UserDeviceSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export default mongoose.model<IUserDevice>('UserDevice', UserDeviceSchema);
