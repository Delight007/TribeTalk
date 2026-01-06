// export default mongoose.model<IMessage>("Message", messageSchema);

import mongoose, { Document, Types } from "mongoose";

export interface IMessage extends Document {
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  receiver: Types.ObjectId; // or possibly an array
  text: string;
  read: boolean;
  delivered: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    delivered: { type: Boolean, default: false, index: true },
    deliveredAt: { type: Date, default: null },
    read: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound indexes
messageSchema.index({ receiver: 1, delivered: 1, createdAt: 1 });
messageSchema.index({ chat: 1, createdAt: -1 });

export default mongoose.model<IMessage>("Message", messageSchema);
