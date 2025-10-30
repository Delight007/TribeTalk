import express from "express";
import { Types } from "mongoose";
import chatModel from "../models/chat.model";
import messageModel from "../models/message.model";

const chatMessage = express.Router();

// GET /api/messages/:userId/:friendId

chatMessage.get("/:userId/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    const userObjectId = new Types.ObjectId(userId);
    const friendObjectId = new Types.ObjectId(friendId);

    // 🔍 Find the existing chat between the two users
    let chat = await chatModel.findOne({
      participants: { $all: [userObjectId, friendObjectId] },
    });

    if (!chat) {
      console.log("⚠️ No chat found — creating a new one");
      chat = await chatModel.create({
        participants: [userObjectId, friendObjectId],
      });
    }

    console.log("✅ Found chat:", chat._id);

    // 🔍 Fetch messages linked to that chat
    const messages = await messageModel.find({ chat: chat._id }).sort({
      createdAt: 1,
    });

    console.log(`✅ Messages found: ${messages.length}`);
    res.status(200).json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default chatMessage;
