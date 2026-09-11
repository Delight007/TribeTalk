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
import Activity from "../models/activity";
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

    const { type: rawType, media, caption = "", tags = [] } = req.body;
    const type = String(rawType ?? "feed").toLowerCase() as PostData["type"];
    if (!["feed", "story", "reel"].includes(type)) {
      return res.status(400).json({ error: "Invalid post type" });
    }
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
    query.type = type ? String(type).toLowerCase() : "feed";

    if (req.query.author) {
      query.author = req.query.author;
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

    if (index === -1 && foundPost.author.toString() !== userId) {
      const actor = await User.findById(userId).select("name username avatar");
      if (actor) {
        await Activity.create({
          recipient: foundPost.author,
          actor: actor._id,
          actorName: actor.name,
          actorUsername: actor.username,
          actorAvatar: actor.avatar,
          type: "like",
          message: "liked your post",
          postId: foundPost._id,
          postImage: foundPost.media?.[0]?.url,
        });
      }
    }

    return res.json({
      liked: index === -1,
      likesCount: foundPost.likes.length,
    });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
};

export const toggleBookmark = async (req: AuthRequest, res: Response) => {
  try {
    const { postId } = req.params;
    const userId = req.userId!;
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found" });

    const objectUserId = new Types.ObjectId(userId);
    const index = post.bookmarks.findIndex((id) => id.equals(objectUserId));
    if (index === -1) post.bookmarks.push(objectUserId);
    else post.bookmarks.splice(index, 1);

    await post.save();
    return res.json({ bookmarked: index === -1 });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.postId).select("comments");
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.json({ comments: post.comments });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const text = String(req.body.text ?? "").trim();
    if (!text)
      return res.status(400).json({ error: "Comment text is required" });

    const [post, user] = await Promise.all([
      Post.findById(req.params.postId),
      User.findById(req.userId).select("name username avatar"),
    ]);
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (!user) return res.status(404).json({ error: "User not found" });

    post.comments.push({
      author: new Types.ObjectId(req.userId),
      name: user.name,
      username: user.username,
      avatar: user.avatar,
      text,
      createdAt: new Date(),
    });
    post.commentsCount = post.comments.length;
    await post.save();

    const postImage = post.media?.[0]?.url;
    if (post.author.toString() !== req.userId) {
      await Activity.create({
        recipient: post.author,
        actor: user._id,
        actorName: user.name,
        actorUsername: user.username,
        actorAvatar: user.avatar,
        type: "comment",
        message: `commented: "${text.slice(0, 120)}"`,
        postId: post._id,
        postImage,
      });
    }

    const mentionedUsernames = [...text.matchAll(/@([a-zA-Z0-9_.]+)/g)].map(
      (match) => match[1].toLowerCase(),
    );
    if (mentionedUsernames.length) {
      const mentionedUsers = await User.find({
        username: { $in: mentionedUsernames },
        _id: { $ne: user._id },
      }).select("_id");
      await Activity.insertMany(
        mentionedUsers.map((mentionedUser) => ({
          recipient: mentionedUser._id,
          actor: user._id,
          actorName: user.name,
          actorUsername: user.username,
          actorAvatar: user.avatar,
          type: "mention",
          message: "mentioned you in a comment",
          postId: post._id,
          postImage,
        })),
      );
    }

    return res
      .status(201)
      .json({ comment: post.comments[post.comments.length - 1] });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
};
