// import express, { Request, Response } from "express";
// import mongoose from "mongoose";
// import { authenticate } from "../middleware/auth";
// import chatModel from "../models/chat.model";
// import messageModel from "../models/message.model";

// const chatMessage = express.Router();

// // GET /api/messages/:chatId
// chatMessage.get(
//   "/:chatId",
//   authenticate,
//   async (req: Request, res: Response) => {
//     try {
//       const { chatId } = req.params as { chatId: string };

//       if (!mongoose.Types.ObjectId.isValid(chatId)) {
//         return res.status(400).json({ error: "Invalid chatId" });
//       }

//       const chat = await chatModel.findById(chatId);
//       if (!chat) {
//         return res.status(404).json({ error: "Chat not found" });
//       }

//       if (!chat.participants.includes(req.user.id)) {
//         return res.status(403).json({ error: "Access denied" });
//       }

//       const messages = await messageModel
//         .find({ chat: chatId })
//         .sort({ createdAt: 1 });

//       res.status(200).json(messages);
//     } catch (err) {
//       console.error("Error fetching messages:", err);
//       res.status(500).json({ error: "Failed to fetch messages" });
//     }
//   }
// );

// export default chatMessage;

import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { authenticate } from "../middleware/auth";
import chatModel from "../models/chat.model";
import messageModel from "../models/message.model";

const chatMessage = express.Router();

/**
 * GET /api/chatMessages/:chatId
 * Fetch all messages for a chat
 */
chatMessage.get(
  "/:chatId",
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { chatId } = req.params as { chatId: string };

      // 1️⃣ Validate chatId
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ error: "Invalid chatId" });
      }

      // 2️⃣ Find chat
      const chat = await chatModel.findById(chatId);
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // 3️⃣ Check if current user is a participant
      if (
        !chat.participants.includes(new mongoose.Types.ObjectId(req.userId))
      ) {
        return res.status(403).json({ error: "Access denied" });
      }

      console.log("req.userId", req.userId);
      // 4️⃣ Fetch messages and populate sender & receiver info
      const messages = await messageModel
        .find({ chat: chatId })
        .populate("sender", "name avatar")
        .populate("receiver", "name avatar")
        .sort({ createdAt: 1 });

      // 5️⃣ Return messages
      res.status(200).json(messages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

export default chatMessage;
