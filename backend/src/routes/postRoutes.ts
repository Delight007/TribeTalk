import express from "express";
import {
  addComment,
  createPost,
  getComments,
  getPosts,
  toggleBookmark,
  toggleLike,
} from "../controller/postController";
import { authenticate } from "../middleware/auth";

const postRouters = express.Router();

postRouters.post("/", authenticate, createPost);
postRouters.get("/", authenticate, getPosts);
postRouters.post("/:postId/like", authenticate, toggleLike);
postRouters.post("/:postId/bookmark", authenticate, toggleBookmark);
postRouters.get("/:postId/comments", authenticate, getComments);
postRouters.post("/:postId/comments", authenticate, addComment);

export default postRouters;
