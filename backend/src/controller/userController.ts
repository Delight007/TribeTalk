// src/controllers/userController.ts
import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import User from "../models/user";

// ✅ Get all users except logged-in one
export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) return res.status(401).json({ message: "Unauthorized" });

    const users = await User.find({ _id: { $ne: req.userId } }).select(
      "-password"
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// ✅ Follow user
export const followUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.id;

    if (!currentUserId)
      return res.status(401).json({ message: "Unauthorized" });
    if (currentUserId === targetUserId)
      return res.status(400).json({ message: "You cannot follow yourself" });

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser)
      return res.status(404).json({ message: "User not found" });

    // Check if already following
    if (user.following?.includes(targetUserId))
      return res.status(400).json({ message: "Already following this user" });

    // Update both arrays
    user.following = [...(user.following || []), targetUserId];
    targetUser.followers = [...(targetUser.followers || []), currentUserId];

    await user.save();
    await targetUser.save();

    console.log("Follow successful:", { currentUserId, targetUserId });
    res.json({ message: "Followed successfully", targetUser }); // return targetUser for frontend
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// ✅ Unfollow user
export const unfollowUser = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const targetUserId = req.params.id;

    if (!currentUserId)
      return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!user || !targetUser)
      return res.status(404).json({ message: "User not found" });

    user.following = (user.following || []).filter(
      (id) => id.toString() !== targetUserId
    );
    targetUser.followers = (targetUser.followers || []).filter(
      (id) => id.toString() !== currentUserId
    );

    await user.save();
    await targetUser.save();

    console.log("Unfollow successful:", { currentUserId, targetUserId });
    res.json({ message: "Unfollowed successfully", targetUser }); // return targetUser for frontend
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
