import express, { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import user from "../models/user";

const friendsrouter = express.Router();

friendsrouter.get(
  "/friends",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).userId; // ✅ fixed

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const currentUser = await user
        .findById(userId)
        .populate("following", "name avatar email username")
        .populate("followers", "name avatar email username");

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      const following = currentUser.following || [];
      const followers = currentUser.followers || [];

      const mutuals = following.filter((followedUser: any) =>
        followers.some((follower: any) => follower._id.equals(followedUser._id))
      );

      res.json(mutuals);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch friends" });
    }
  }
);

export default friendsrouter;
