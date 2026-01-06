// import mongoose, { Document, Schema, Types } from "mongoose";

// export interface IChat extends Document {
//   participants: Types.ObjectId[];
//   lastMessage?: Types.ObjectId;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// const chatSchema = new Schema<IChat>(
//   {
//     participants: [
//       { type: Schema.Types.ObjectId, ref: "User", required: true },
//     ],
//     lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
//   },
//   { timestamps: true }
// );

// export default mongoose.model<IChat>("Chat", chatSchema);

import mongoose, { Document, Schema, Types } from "mongoose";

export interface IChat extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  unreadCountByUser: Map<string, number>;
  isGroup?: boolean;
  name?: string; // for group
  avatarUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatSchema = new Schema<IChat>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date },
    unreadCountByUser: {
      type: Map,
      of: Number,
      default: {}, // ensures map is initialized
    },
    isGroup: { type: Boolean, default: false },
    name: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
  },
  { timestamps: true }
);

// Indexes
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ participants: 1, updatedAt: -1 });

export default mongoose.model<IChat>("Chat", chatSchema);
