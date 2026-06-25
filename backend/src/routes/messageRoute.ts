// import express from "express";
// import { Types } from "mongoose";
// import Chat from "../models/chat.model";
// import Message from "../models/message.model";

// const messageRoutes = express.Router();

// messageRoutes.post("/", async (req, res) => {
//   console.log("📩 Incoming message payload:", req.body);

//   try {
//     const { sender, receiver, text } = req.body;

//     if (!sender || !receiver || !text) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     const senderObjectId = new Types.ObjectId(sender);
//     const receiverObjectId = new Types.ObjectId(receiver);

//     // Find or create chat
//     let chat = await Chat.findOne({
//       participants: { $all: [senderObjectId, receiverObjectId] },
//       isGroup: false, // ensure consistent
//     });

//     if (!chat) {
//       chat = await Chat.create({
//         participants: [senderObjectId, receiverObjectId],
//         isGroup: false,
//       });
//     }

//     // Create and save new message
//     const message = new Message({
//       chat: chat._id,
//       sender: senderObjectId,
//       receiver: receiverObjectId,
//       text,
//     });
//     await message.save();
//     console.log("✅ Message saved:", message);

//     // Update chat metadata: last message & unread counts
//     const receiverIdStr = receiverObjectId.toString();

//     // Use update so we don't rely on stale `chat` instance
//     await Chat.findByIdAndUpdate(chat._id, {
//       lastMessage: message._id,
//       lastMessageAt: message.createdAt || new Date(),
//       // Optionally update unread count map:
//       [`unreadCountByUser.${receiverIdStr}`]:
//         (chat.unreadCountByUser.get(receiverIdStr) ?? 0) + 1,
//     });

//     return res.status(201).json({ success: true, message });
//   } catch (err) {
//     console.error("Error sending message:", err);
//     return res.status(500).json({ error: "Failed to send message" });
//   }
// });

// export default messageRoutes;

import express, { Request, Response } from "express";
import { Types } from "mongoose";
import { authenticate } from "../middleware/auth";
import Chat from "../models/chat.model";
import Message from "../models/message.model";
const messageRoutes = express.Router();

/**
 * Send message (text, image, video, document, voice)
 */
// messageRoutes.post("/", authenticate, async (req: Request, res: Response) => {
//   console.log("📩 Incoming message payload:", req.body);

//   try {
//     const {
//       sender,
//       receiver,
//       type,
//       text,
//       mediaUrl,
//       fileName,
//       fileSize,
//       duration,
//     } = req.body;

//     if (!sender || !receiver) {
//       return res
//         .status(400)
//         .json({ error: "Sender and receiver are required" });
//     }

//     const allowedTypes = [
//       "text",
//       "image",
//       "video",
//       "document",
//       "voice",
//     ] as const;

//     if (!allowedTypes.includes(type)) {
//       return res.status(400).json({ error: "Invalid message type" });
//     }

//     // ✅ Type-specific validation
//     if (type === "text" && !text?.trim()) {
//       return res
//         .status(400)
//         .json({ error: "Text is required for text messages" });
//     }

//     if (type !== "text" && !mediaUrl) {
//       return res
//         .status(400)
//         .json({ error: `mediaUrl is required for ${type}` });
//     }

//     if (type === "document" && !fileName) {
//       return res
//         .status(400)
//         .json({ error: "fileName is required for document" });
//     }

//     if (type === "voice" && typeof duration !== "number") {
//       return res
//         .status(400)
//         .json({ error: "duration is required for voice messages" });
//     }

//     const senderId = new Types.ObjectId(sender);
//     const receiverId = new Types.ObjectId(receiver);

//     // 🔍 Find or create chat
//     let chat = await Chat.findOne({
//       participants: { $all: [senderId, receiverId] },
//       isGroup: false,
//     });

//     if (!chat) {
//       chat = await Chat.create({
//         participants: [senderId, receiverId],
//         isGroup: false,
//       });
//     }

//     // 💾 Create message
//     const message = await Message.create({
//       chat: chat._id,
//       sender: senderId,
//       receiver: receiverId,
//       type,
//       text: text?.trim(),
//       mediaUrl,
//       fileName,
//       fileSize,
//       duration,
//     });

//     // 🔄 Update chat metadata
//     const receiverIdStr = receiverId.toString();
//     await Chat.findByIdAndUpdate(chat._id, {
//       lastMessage: message._id,
//       lastMessageAt: message.createdAt,
//       [`unreadCountByUser.${receiverIdStr}`]:
//         (chat.unreadCountByUser.get(receiverIdStr) ?? 0) + 1,
//     });

//     // 🔔 Emit socket event
//     const io = req.app.get("io");
//     io?.to(receiverIdStr).emit("newMessage", message);

//     return res.status(201).json({ success: true, message });
//   } catch (error) {
//     console.error("❌ Error sending message:", error);
//     return res.status(500).json({ error: "Failed to send message" });
//   }
// });

messageRoutes.post("/", authenticate, async (req: Request, res: Response) => {
  console.log("📩 Incoming message payload:", req.body);

  try {
    const { chatId, type, text, mediaUrl, fileName, fileSize, duration } = req.body;
    const senderId = req.user._id; // authenticated user

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    const allowedTypes = ["text", "image", "video", "document", "voice"] as const;
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: "Invalid message type" });
    }

    if (type === "text" && !text?.trim()) {
      return res.status(400).json({ error: "Text is required for text messages" });
    }
    if (type !== "text" && !mediaUrl) {
      return res.status(400).json({ error: `mediaUrl is required for ${type}` });
    }
    if (type === "document" && !fileName) {
      return res.status(400).json({ error: "fileName is required for document" });
    }
    if (type === "voice" && typeof duration !== "number") {
      return res.status(400).json({ error: "duration is required for voice messages" });
    }

    // 🔍 Fetch chat and determine receiver
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    // One-to-one chat
    const receiverId = chat.participants.find(
      (p: Types.ObjectId) => !p.equals(senderId)
    );
    if (!receiverId) return res.status(400).json({ error: "Receiver not found" });

    // 💾 Create message
    const message = await Message.create({
      chat: chat._id,
      sender: senderId,
      receiver: receiverId,
      type,
      text: text?.trim(),
      mediaUrl,
      fileName,
      fileSize,
      duration,
    });

    // 🔄 Update chat metadata
    const receiverIdStr = receiverId.toString();
    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
      [`unreadCountByUser.${receiverIdStr}`]:
        (chat.unreadCountByUser.get(receiverIdStr) ?? 0) + 1,
    });

    // 🔔 Emit socket event to receiver
    const io = req.app.get("io");
    io?.to(receiverIdStr).emit("receiveMessage", {
      ...message.toObject(),
      userId: senderId, // frontend uses this to know who sent it
    });

    return res.status(201).json({ success: true, message });
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
});


export default messageRoutes;
