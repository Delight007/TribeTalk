// routes/userRoutes.ts
import express from "express";
import {
  followUser,
  getAllUsers,
  unfollowUser,
} from "../controller/userController";
import { authenticate } from "../middleware/auth";

const userRouter = express.Router();

// 🔐 All these routes require a valid JWT token
userRouter.get("/", authenticate, getAllUsers);
userRouter.post("/follow/:id", authenticate, followUser);
userRouter.post("/unfollow/:id", authenticate, unfollowUser);

export default userRouter;
