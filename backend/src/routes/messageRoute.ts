import express from "express";
import { Types } from "mongoose";
import Chat, { IChat } from "../models/chat.model";
import Message, { IMessage } from "../models/message.model";

const messageRoutes = express.Router();

messageRoutes.post("/", async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;

    if (!senderId || !receiverId || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const senderObjectId = new Types.ObjectId(senderId);
    const receiverObjectId = new Types.ObjectId(receiverId);

    // ✅ Explicitly type the query result
    let chat: IChat | null = await Chat.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
    });

    // ✅ If no chat, create one
    if (!chat) {
      chat = await Chat.create({
        participants: [senderObjectId, receiverObjectId],
      });
    }

    // ✅ Create new message
    const message: IMessage = await Message.create({
      chat: chat._id,
      sender: senderObjectId,
      text,
    });

    // ✅ Now TypeScript knows chat is not null
    chat.lastMessage = message._id as Types.ObjectId;
    await chat.save();

    res.status(201).json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

export default messageRoutes;
