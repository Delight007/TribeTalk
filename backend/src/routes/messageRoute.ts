import express from "express";
import { Types } from "mongoose";
import Chat, { IChat } from "../models/chat.model";
import Message from "../models/message.model";

const messageRoutes = express.Router();

messageRoutes.post("/", async (req, res) => {
  console.log("📩 Incoming message payload:", req.body);

  try {
    const { sender, receiver, text } = req.body;

    if (!sender || !receiver || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const senderObjectId = new Types.ObjectId(sender);
    const receiverObjectId = new Types.ObjectId(receiver);

    // Find or create chat
    let chat: IChat | null = await Chat.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderObjectId, receiverObjectId],
      });
    }

    // ✅ Create message without manually overriding timestamps or defaults
    const message = new Message({
      chat: chat._id,
      sender: senderObjectId,
      receiver: receiverObjectId,
      text,
    });

    await message.save();
    console.log("✅ Message saved:", message);
    res.status(201).json(message);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default messageRoutes;
