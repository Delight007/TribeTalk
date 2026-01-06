import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  username?: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationCode?: string;
  codeExpiresAt?: Date;
  name: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  gender?: string;
  dateOfBirth?: Date;
  following?: string[]; // 👈 users this user is following
  followers?: string[]; // 👈 users following this user
  createdAt?: Date;
  updatedAt?: Date;
  fcmToken?: string; // ← ADD THIS
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, unique: true, sparse: true, default: null },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    codeExpiresAt: { type: Date },

    bio: { type: String, default: "" },
    avatar: { type: String, default: "" },
    phone: { type: String, default: "" },
    gender: {
      type: String,
      enum: ["Male", "Female", "Prefer not to say"],
      default: "Prefer not to say",
    },
    dateOfBirth: { type: Date },

    // 👇 New fields for follow feature
    following: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User", default: [] }],
    fcmToken: { type: String, default: null }, // ← ADD THIS
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
