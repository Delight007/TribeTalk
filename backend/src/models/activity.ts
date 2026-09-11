import { Document, Schema, Types, model } from "mongoose";

export type ActivityType = "like" | "comment" | "request" | "mention";

export interface IActivity extends Document {
  recipient: Types.ObjectId;
  actor: Types.ObjectId;
  actorName: string;
  actorUsername?: string;
  actorAvatar?: string;
  type: ActivityType;
  message: string;
  postId?: Types.ObjectId;
  postImage?: string;
  read: boolean;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String, required: true },
    actorUsername: String,
    actorAvatar: String,
    type: {
      type: String,
      enum: ["like", "comment", "request", "mention"],
      required: true,
    },
    message: { type: String, required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    postImage: String,
    read: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model<IActivity>("Activity", ActivitySchema);
