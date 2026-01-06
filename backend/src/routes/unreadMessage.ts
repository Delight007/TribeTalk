import express from "express";
import {
  getUndeliveredMessages,
  markMessagesAsRead,
} from "../controller/messageController";
import { authenticate } from "../middleware/auth";

const unreadMessages = express.Router();

unreadMessages.get("/undelivered", authenticate, getUndeliveredMessages);

unreadMessages.post("/mark-read", authenticate, markMessagesAsRead);

export default unreadMessages;
