// import { Document, Schema, Types, model } from "mongoose";

// export interface IPost extends Document {
//   author: Types.ObjectId;
//   username: string;
//   handle: string;
//   avatar?: string;
//   image: string;
//   caption: string;
//   tags: string[];
//   likes: Types.ObjectId[];
//   commentsCount: number;
// }

// const PostSchema = new Schema<IPost>(
//   {
//     author: { type: Schema.Types.ObjectId, ref: "User", required: true },
//     username: { type: String, required: true },
//     handle: { type: String, required: true },
//     avatar: String,
//     image: { type: String, required: true },
//     caption: String,
//     tags: [String],
//     likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
//     commentsCount: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );

// export default model<IPost>("Post", PostSchema);

import { Document, Schema, Types, model } from "mongoose";

export interface IPost extends Document {
  author: Types.ObjectId;
  username: string;
  avatar?: string;
  name: string;

  type: "feed" | "story" | "reel";

  // For feed + reels: supports multiple media
  media: {
    url: string;
    type: "image" | "video";
  }[];

  caption?: string;
  tags?: string[];

  likes: Types.ObjectId[];
  commentsCount: number;

  // Story-specific field
  expiresAt?: Date;
}

const PostSchema = new Schema<IPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    avatar: String,
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["feed", "story", "reel"],
      default: "feed",
    },

    // Multiple media support
    media: [
      {
        url: { type: String, required: true },
        type: { type: String, enum: ["image", "video"], required: true },
      },
    ],

    caption: String,
    tags: [String],

    likes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    commentsCount: { type: Number, default: 0 },

    expiresAt: Date,
  },
  { timestamps: true }
);

export default model<IPost>("Post", PostSchema);
