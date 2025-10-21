// routes/chat.routes.ts
import express from "express";
import Chat from "../models/chat.model";

const chatRouter = express.Router();

// Get all chats for a user
chatRouter.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const chats = await Chat.find({ participants: userId })
      .populate({
        path: "participants",
        select: "name username avatar",
      })
      .populate({
        path: "lastMessage",
        select: "text createdAt sender",
      })
      .sort({ updatedAt: -1 });

    // Format chat list (show friend info instead of self)
    const formatted = chats.map((chat: any) => {
      const friend = chat.participants.find(
        (p: any) => p._id.toString() !== userId
      );

      return {
        id: chat._id,
        friend,
        lastMessage: chat.lastMessage?.text || "",
        lastMessageAt: chat.lastMessage?.createdAt || chat.updatedAt,
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch chats" });
  }
});

export default chatRouter;
