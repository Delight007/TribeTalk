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
