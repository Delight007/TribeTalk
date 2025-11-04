import { Request, Response } from "express";
import mongoose from "mongoose";
import ChatModel from "../models/chat.model";

// Fetch all chats for a user (with last message preview)
export async function getChatsForUser(req: Request, res: Response) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user!.id); // Assuming you have req.user
    const chats = await ChatModel.aggregate([
      { $match: { participants: userId } },
      { $sort: { updatedAt: -1 } },
      {
        $lookup: {
          from: "messages",
          localField: "lastMessage",
          foreignField: "_id",
          as: "lastMsg",
        },
      },
      {
        $unwind: {
          path: "$lastMsg",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          participants: 1,
          isGroup: 1,
          name: 1,
          avatarUrl: 1,
          lastMessage: "$lastMsg.text",
          lastMessageSender: "$lastMsg.sender",
          lastMessageCreatedAt: "$lastMsg.createdAt",
          updatedAt: 1,
        },
      },
    ]).exec();

    return res.json({ success: true, data: chats });
  } catch (error) {
    console.error("Error in getChatsForUser:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Create or fetch existing chat between participants (for one-to-one)
export async function getOrCreateChat(req: Request, res: Response) {
  try {
    const { otherUserId } = req.body;
    const userId = new mongoose.Types.ObjectId(req.user!.id);
    const otherId = new mongoose.Types.ObjectId(otherUserId);

    let chat = await ChatModel.findOne({
      participants: { $all: [userId, otherId] },
      isGroup: false,
    });
    if (!chat) {
      chat = await ChatModel.create({
        participants: [userId, otherId],
        isGroup: false,
      });
    }
    return res.json({ success: true, data: chat });
  } catch (error) {
    console.error("Error in getOrCreateChat:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
