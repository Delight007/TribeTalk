// routes/chat.routes.ts
import express from "express";
import { getChatsForUser, getOrCreateChat } from "../controller/chatController";
import { authenticate } from "../middleware/auth";

const chatRouter = express.Router();
// Get list of chats for the authenticated user
chatRouter.get("/", authenticate, getChatsForUser);

// Create (or retrieve) a one-to-one chat with another user
chatRouter.post("/one-to-one", authenticate, getOrCreateChat);

export default chatRouter;

// GET /api/messages/:chatId
// chatRouter.get("/:chatId", async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const messages = await messageModel
//       .find({ chat: chatId })
//       .sort({ createdAt: 1 })
//       .lean();

//     res.status(200).json(messages);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch messages" });
//   }
// });
