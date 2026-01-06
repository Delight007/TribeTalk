import express from "express";
import { createPost, getPosts, toggleLike } from "../controller/postController";
import { authenticate } from "../middleware/auth";

const postRouters = express.Router();

postRouters.post("/", authenticate, createPost);
postRouters.get("/", authenticate, getPosts);
postRouters.post("/:postId/like", authenticate, toggleLike);

export default postRouters;
