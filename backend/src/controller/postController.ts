// import { Request, Response } from "express";
// import { Types } from "mongoose";
// import { AuthRequest } from "../middleware/auth";
// import Post from "../models/post"; // PascalCase import

// // Create post
// export const createPost = async (req: AuthRequest, res: Response) => {
//   try {
//     const userId = req.userId!;

//     // Expect the frontend to send image, caption, tags
//     const { image, caption, tags } = req.body;

//     // Create post with Cloudinary URL already in req.body.image
//     const newPost = await Post.create({
//       author: userId,
//       username: req.body.username,
//       handle: req.body.handle,
//       avatar: req.body.avatar,
//       image,
//       caption,
//       tags,
//     });

//     return res.status(201).json(newPost);
//   } catch (error) {
//     return res.status(500).json({ error: (error as Error).message });
//   }
// };

// // Fetch posts
// export const getPosts = async (_req: Request, res: Response) => {
//   try {
//     const posts = await Post.find().sort({ createdAt: -1 }); // use Post here
//     return res.json({ posts });
//   } catch (error) {
//     return res.status(500).json({ error: (error as Error).message });
//   }
// };

// // Like/Unlike
// export const toggleLike = async (req: AuthRequest, res: Response) => {
//   try {
//     const { postId } = req.params;
//     // const { userId }: { userId: string } = req.body;
//     const userId = req.userId!; // we know it exists because of authenticate

//     const foundPost = await Post.findById(postId);
//     if (!foundPost) return res.status(404).json({ error: "Post not found" });

//     const objectUserId = new Types.ObjectId(userId); // 👈 convert

//     const index = foundPost.likes.findIndex((id) => id.equals(objectUserId));

//     if (index === -1) {
//       foundPost.likes.push(objectUserId); // 👈 safe now
//     } else {
//       foundPost.likes.splice(index, 1);
//     }

//     await foundPost.save();
//     return res.json({ likesCount: foundPost.likes.length });
//   } catch (err) {
//     return res.status(500).json({ error: (err as Error).message });
//   }
// };

import { Request, Response } from "express";
import { Types } from "mongoose";
import { AuthRequest } from "../middleware/auth";
import Post from "../models/post"; // PascalCase import

// Create a post (feed/story/reel)
// export const createPost = async (req: AuthRequest, res: Response) => {
//   console.log("🔥 Received POST /api/posts");

//   try {
//     const userId = req.userId!;

//     // Expect frontend to send:
//     // - type: "feed" | "story" | "reel"
//     // - media: [{ url, type }]
//     // - caption (optional)
//     // - tags (optional)
//     const { type, media, caption, tags } = req.body;

//     // Build postData
//     const postData: any = {
//       author: userId,
//       username: req.body.username,
//       handle: req.body.handle,
//       avatar: req.body.avatar,
//       type,
//       media,
//       caption,
//       tags,
//     };

//     // Set story expiry
//     if (type === "story") {
//       postData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
//     }

//     const newPost = await Post.create(postData);

//     return res.status(201).json(newPost);
//   } catch (error) {
//     console.error("🔥 createPost error:", error); // ← log full error

//     return res.status(500).json({ error: (error as Error).message });
//   }
// };
import User from "../models/user";

type MediaType = "image" | "video";

type PostData = {
  author: string;
  name: string;
  username?: string;
  avatar?: string;
  type: "feed" | "story" | "reel";
  media: { url: string; type: MediaType }[];
  caption?: string;
  tags?: string[];
  expiresAt?: Date; // ← optional
};
export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Fetch user info from DB
    const user = await User.findById(userId).select("username name avatar");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const { type, media, caption = "", tags = [] } = req.body;
    // You can put this in a shared types file like src/types/post.ts

    const postData: PostData = {
      author: userId,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      type,
      media,
      caption,
      tags,
    };

    if (type === "story") {
      postData.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    const newPost = await Post.create(postData);
    res.status(201).json(newPost);
  } catch (error) {
    console.error("🔥 createPost error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
};

// Fetch posts (can filter by type: feed, story, reel)
export const getPosts = async (req: Request, res: Response) => {
  try {
    const { type, page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};

    // If a type is provided, filter by it
    if (type) {
      query.type = type;
    }

    // If fetching stories, only return non‑expired ones
    if (type === "story") {
      query.expiresAt = { $gt: new Date() };
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.json({ posts });
  } catch (error) {
    return res.status(500).json({ error: (error as Error).message });
  }
};

// Like/Unlike a post
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId!;

    const foundPost = await Post.findById(postId);
    if (!foundPost) return res.status(404).json({ error: "Post not found" });

    const objectUserId = new Types.ObjectId(userId);

    const index = foundPost.likes.findIndex((id) => id.equals(objectUserId));

    if (index === -1) {
      foundPost.likes.push(objectUserId);
    } else {
      foundPost.likes.splice(index, 1);
    }

    await foundPost.save();

    return res.json({ likesCount: foundPost.likes.length });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
};
