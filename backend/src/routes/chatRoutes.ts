// routes/chat.routes.ts
import express from "express";
import messageModel from "../models/message.model";

const chatRouter = express.Router();

// GET /api/messages/:chatId
chatRouter.get("/:chatId", async (req, res) => {
  try {
    const { chatId } = req.params;
    const messages = await messageModel
      .find({ chat: chatId })
      .sort({ createdAt: 1 })
      .lean();

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

export default chatRouter;
