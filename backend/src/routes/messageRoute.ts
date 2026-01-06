// import express from "express";
// import { Types } from "mongoose";
// import Chat, { IChat } from "../models/chat.model";
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
//     let chat: IChat | null = await Chat.findOne({
//       participants: { $all: [senderObjectId, receiverObjectId] },
//     });

//     if (!chat) {
//       chat = await Chat.create({
//         participants: [senderObjectId, receiverObjectId],
//       });
//     }

//     // ✅ Create message without manually overriding timestamps or defaults
//     const message = new Message({
//       chat: chat._id,
//       sender: senderObjectId,
//       receiver: receiverObjectId,
//       text,
//     });
//     // Ensure unreadCountByUser map exists
//     if (!chat.unreadCountByUser) {
//       chat.unreadCountByUser = new Map<string, number>();
//     }

//     const receiverIdStr = receiverObjectId.toString();
//     const prevCount = chat.unreadCountByUser.get(receiverIdStr) ?? 0;
//     chat.unreadCountByUser.set(receiverIdStr, prevCount + 1);

//     await message.save();
//     console.log("✅ Message saved:", message);
//     res.status(201).json(message);
//   } catch (err) {
//     console.error("Error sending message:", err);
//     res.status(500).json({ error: "Failed to send message" });
//   }
// });

// export default messageRoutes;

import express from "express";
import { Types } from "mongoose";
import Chat from "../models/chat.model";
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
    let chat = await Chat.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
      isGroup: false, // ensure consistent
    });

    if (!chat) {
      chat = await Chat.create({
        participants: [senderObjectId, receiverObjectId],
        isGroup: false,
      });
    }

    // Create and save new message
    const message = new Message({
      chat: chat._id,
      sender: senderObjectId,
      receiver: receiverObjectId,
      text,
    });
    await message.save();
    console.log("✅ Message saved:", message);

    // Update chat metadata: last message & unread counts
    const receiverIdStr = receiverObjectId.toString();

    // Use update so we don't rely on stale `chat` instance
    await Chat.findByIdAndUpdate(chat._id, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt || new Date(),
      // Optionally update unread count map:
      [`unreadCountByUser.${receiverIdStr}`]:
        (chat.unreadCountByUser.get(receiverIdStr) ?? 0) + 1,
    });

    return res.status(201).json({ success: true, message });
  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({ error: "Failed to send message" });
  }
});

export default messageRoutes;
