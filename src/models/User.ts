import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userid: string;
  name: string;
  email: string;
  password?: string;
  dob: Date;
  pronouns: string;
  profilePic: string;
  bio: string;
  xp: number;
  level: number;
  badges: string[];
  selectedBadges: string[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isPrivate: boolean;
  isDiscoveryEnabled: boolean; // For auto-discovery toggle
  blockedUsers: mongoose.Types.ObjectId[]; // List of blocked users
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  role: 'user' | 'admin' | 'founder';
  isVerified: boolean;
  totalLikesReceived: number;
  totalCommentsReceived: number;
  isBanned: boolean;
  lastSeen?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    userid: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String },
    dob: { type: Date, required: true },
    pronouns: { type: String, default: '' },
    profilePic: { type: String, default: '' },
    bio: { type: String, default: '' },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: String }],
    selectedBadges: [{ type: String }],
    followersCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
    postsCount: { type: Number, default: 0 },
    isPrivate: { type: Boolean, default: false },
    isDiscoveryEnabled: { type: Boolean, default: true },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    location: {
      type: { type: String, enum: ['Point'] },
      coordinates: { type: [Number] },
    },
    role: { type: String, enum: ['user', 'admin', 'founder'], default: 'user' },
    isVerified: { type: Boolean, default: false },
    totalLikesReceived: { type: Number, default: 0 },
    totalCommentsReceived: { type: Number, default: 0 },
    isBanned: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for geospatial queries
UserSchema.index({ location: '2dsphere' });

export default mongoose.model<IUser>('User', UserSchema);
