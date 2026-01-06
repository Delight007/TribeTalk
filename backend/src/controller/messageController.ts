// import { Request, Response } from "express";
// import mongoose from "mongoose";
// import MessageModel from "../models/message.model";

// // Fetch undelivered (offline) messages for a user
// export async function getUndeliveredMessages(req: Request, res: Response) {
//   try {
//     const userId = new mongoose.Types.ObjectId(req.user!.id);
//     const messages = await MessageModel.find({
//       receiver: userId,
//       delivered: false,
//     })
//       .sort({ createdAt: 1 })
//       .lean()
//       .exec();

//     return res.json({ success: true, data: messages });
//   } catch (error) {
//     console.error("Error in getUndeliveredMessages:", error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// // Mark messages as read in a chat for a user
// export async function markMessagesAsRead(req: Request, res: Response) {
//   try {
//     const userId = new mongoose.Types.ObjectId(req.user!.id);
//     const chatId = new mongoose.Types.ObjectId(req.body.chatId);

//     const result = await MessageModel.updateMany(
//       {
//         chat: chatId,
//         receiver: userId,
//         read: false,
//       },
//       {
//         $set: { read: true, readAt: new Date() },
//       }
//     );
//     // Optionally update Chat participant lastSeen if you store that
//     // await ChatModel.updateOne(...)

//     return res.json({ success: true, modifiedCount: result.modifiedCount });
//   } catch (error) {
//     console.error("Error in markMessagesAsRead:", error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// }

// src/controllers/messageController.ts

import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth";
import MessageModel from "../models/message.model";

// Fetch undelivered (offline) messages for a user
export async function getUndeliveredMessages(req: AuthRequest, res: Response) {
  try {
    const userIdStr = req.userId;
    if (!userIdStr) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const userId = new mongoose.Types.ObjectId(userIdStr);

    const messages = await MessageModel.find({
      receiver: userId,
      delivered: false,
    })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    return res.json({ success: true, data: messages });
  } catch (error) {
    console.error("Error in getUndeliveredMessages:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}

// Mark messages as read in a chat for a user
export async function markMessagesAsRead(req: AuthRequest, res: Response) {
  try {
    const userIdStr = req.userId;
    if (!userIdStr) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { chatId } = req.body;
    if (!chatId) {
      return res
        .status(400)
        .json({ success: false, message: "chatId is required" });
    }

    const userId = new mongoose.Types.ObjectId(userIdStr);
    const chatObjId = new mongoose.Types.ObjectId(chatId);

    const result = await MessageModel.updateMany(
      {
        chat: chatObjId,
        receiver: userId,
        read: false,
      },
      {
        $set: { read: true, readAt: new Date() },
      }
    );

    return res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
