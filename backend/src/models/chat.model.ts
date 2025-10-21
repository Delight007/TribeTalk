import mongoose, { Document, Schema, Types } from "mongoose";

export interface IChat extends Document {
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const chatSchema = new Schema<IChat>(
  {
    participants: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: true }
);

export default mongoose.model<IChat>("Chat", chatSchema);
