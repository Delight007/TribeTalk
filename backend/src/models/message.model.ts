import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMessage>("Message", messageSchema);
