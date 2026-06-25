// src/socket/socket.controller.ts
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import chatModel from "../models/chat.model";
import messageModel from "../models/message.model";
import user from "../models/user";
import { generateAgoraToken } from "../utils/agoraToken";
import { sendNotification } from "../utils/sendNotification";

interface OnlineUsers {
  [userId: string]: string[];
}

export function initSocket(io: Server) {
  const onlineUsers: OnlineUsers = {};

  // ===== JWT authentication middleware =====
  io.use((socket: Socket, next: (err?: Error) => void) => {
    console.log("🟢 New socket handshake auth data:", socket.handshake.auth);
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      console.warn(`❌ Socket ${socket.id} missing token`);
      return next(new Error("Authentication error: token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      socket.data.user = decoded;
      console.log(`🔑 Socket ${socket.id} authenticated user:`, decoded);
      next();
    } catch (err) {
      console.warn(`❌ Socket ${socket.id} failed JWT verification`);
      return next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;
    console.log(`🟢 Socket connected: ${socket.id} (user: ${userId})`);

    // ===== Register & track sockets =====
    socket.on("register", (userIdFromClient: string) => {
      const uid = userIdFromClient || userId;
      if (!onlineUsers[uid]) onlineUsers[uid] = [];
      onlineUsers[uid].push(socket.id);
      socket.join(uid);
      console.log(`✅ Registered & joined room: ${uid} → ${onlineUsers[uid]}`);
      io.emit("userOnline", { userId: uid });
    });

    // ===== Handle offline messages on reconnection =====
    socket.on("userReconnected", async (userIdFromClient: string) => {
      const uid = userIdFromClient || userId;
      console.log(`🔄 User reconnected: ${uid}`);
      try {
        const undelivered = await messageModel
          .find({ receiver: uid, delivered: false })
          .sort({ createdAt: 1 });

        if (undelivered.length > 0) {
          console.log(
            `🕒 Found ${undelivered.length} undelivered messages for ${uid}`
          );
          (onlineUsers[uid] || []).forEach((sid) =>
            io.to(sid).emit("offlineMessages", undelivered)
          );

          await messageModel.updateMany(
            { receiver: uid, delivered: false },
            { $set: { delivered: true, deliveredAt: new Date() } }
          );
          console.log(`✅ Marked undelivered messages as delivered for ${uid}`);
        }
      } catch (err) {
        console.error("❌ Error fetching offline messages:", err);
      }
    });

    // ===== Join / leave rooms =====
    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      console.log(`👥 ${socket.id} joined room ${roomId}`);
    });

    socket.on("leaveRoom", (roomId: string) => {
      socket.leave(roomId);
      console.log(`👋 ${socket.id} left room ${roomId}`);
    });

   
    interface SocketMessage {
      sender: string;
      receiver: string;
      text?: string;
      type: "text" | "image" | "video" | "document" | "voice";
      mediaUrl?: string;
      fileName?: string;
      fileSize?: number;
      duration?: number; // for voice
    }

    // socket.on(
    //   "sendMessage",
    //   async (
    //     {
    //       roomId,
    //       message,
    //       tempId,
    //     }: { roomId: string; message: SocketMessage; tempId?: string },
    //     callback?: (msg: any) => void
    //   ) => {
    //     console.log(
    //       `✉️ sendMessage received from ${message?.sender} to ${message?.receiver}:`,
    //       message?.text || message?.mediaUrl
    //     );

    //     try {
    //       if (!message) {
    //         console.log("❌ Invalid message payload");
    //         return socket.emit("messageError", {
    //           error: "Invalid message payload",
    //         });
    //       }

    //       const {
    //         sender,
    //         receiver,
    //         text,
    //         type,
    //         mediaUrl,
    //         fileName,
    //         fileSize,
    //         duration,
    //       } = message;

    //       if (!sender || !receiver) {
    //         console.log("❌ Missing sender or receiver");
    //         return socket.emit("messageError", {
    //           error: "Missing sender or receiver",
    //         });
    //       }

    //       const allowedTypes = ["text", "image", "video", "document", "voice"];
    //       const messageType = allowedTypes.includes(type) ? type : "text";

    //       if (messageType === "text" && !text?.trim()) {
    //         console.log("❌ Text is required for type 'text'");
    //         return socket.emit("messageError", { error: "Text is required" });
    //       }

    //       // Find or create chat
    //       let chat = await chatModel.findOne({
    //         participants: { $all: [sender, receiver] },
    //       });
    //       if (!chat) {
    //         chat = await chatModel.create({ participants: [sender, receiver] });
    //         console.log(
    //           `🆕 Created new chat ${chat._id} for ${sender} & ${receiver}`
    //         );
    //       }

    //       // Create message
    //       const newMsg = await messageModel.create({
    //         chat: chat._id,
    //         sender,
    //         receiver,
    //         text: text?.trim(),
    //         type: messageType,
    //         mediaUrl,
    //         fileName,
    //         fileSize,
    //         duration,
    //       });
    //       console.log("✅ Message saved:", newMsg);

    //       // Check if receiver is online
    //       const recSockets = await io.in(receiver).fetchSockets();
    //       if (recSockets.length > 0) {
    //         await messageModel.findByIdAndUpdate(newMsg._id, {
    //           delivered: true,
    //           deliveredAt: new Date(),
    //         });
    //         newMsg.delivered = true as any;
    //         newMsg.deliveredAt = new Date() as any;
    //         console.log(`✅ Message delivered to online receiver ${receiver}`);
    //       } else {
    //         console.log(
    //           `📭 Receiver ${receiver} offline, message will be delivered on reconnect`
    //         );
    //       }

    //       // Push notifications
    //       const friendObj = await user.findById(sender).lean();
    //       if (friendObj) {
    //         sendNotification(
    //           receiver,
    //           "New Message",
    //           text || "Attachment",
    //           String(chat._id),
    //           {
    //             _id: String(friendObj._id),
    //             name: friendObj.name,
    //             avatar: friendObj.avatar,
    //             email: friendObj.email,
    //             username: friendObj.username,
    //             chatId: String(chat._id),
    //           }
    //         );
    //         console.log(`🔔 Push notification sent to ${receiver}`);
    //       }

    //       // Emit to room + receiver
    //       const payload = { ...newMsg.toObject(), roomId, tempId };
    //       socket.broadcast.to(roomId).emit("receiveMessage", payload);
    //       io.to(receiver).emit("receiveMessage", payload);

    //       // Reply to sender for optimistic UI
    //       if (callback) callback(payload);

    //       io.to(sender).emit("messageDelivered", {
    //         messageId: newMsg._id,
    //         delivered: !!newMsg.delivered,
    //         deliveredAt: newMsg.deliveredAt || null,
    //         tempId,
    //         chat: newMsg.chat,
    //       });
    //       console.log(`📤 messageDelivered emitted back to sender ${sender}`);
    //     } catch (err) {
    //       console.error("❌ Error sendMessage:", err);
    //       socket.emit("messageError", { error: "Failed to send message" });
    //     }
    //   }
    // );

    // ===== Handle offline messages when user reconnects =====
   
    socket.on(
  "sendMessage",
  async (
    { roomId, message, tempId }: { roomId: string; message: SocketMessage; tempId?: string },
    callback?: (msg: any) => void
  ) => {
    console.log("✉️ sendMessage received:", message?.text || message?.mediaUrl);

    try {
      if (!message || !roomId) {
        console.log("❌ Invalid message payload or missing roomId");
        return socket.emit("messageError", { error: "Invalid message payload" });
      }

      const sender = socket.data.user.id; // Authenticated user

      // Find chat
      let chat = await chatModel.findById(roomId);
      if (!chat) {
        console.log(`❌ Chat not found: ${roomId}`);
        return socket.emit("messageError", { error: "Chat not found" });
      }

      // Determine receiver for one-to-one chat
      const receiver = chat.participants.find((p: any) => p.toString() !== sender.toString());
      if (!receiver) {
        console.log(`❌ Receiver not found for chat ${roomId}`);
        return socket.emit("messageError", { error: "Receiver not found" });
      }

      // Validate message type
      const allowedTypes = ["text", "image", "video", "document", "voice"];
      const type = allowedTypes.includes(message.type) ? message.type : "text";
      if (type === "text" && !message.text?.trim()) {
        return socket.emit("messageError", { error: "Text is required" });
      }
      if (type !== "text" && !message.mediaUrl) {
        return socket.emit("messageError", { error: "mediaUrl is required" });
      }

      // Create message
      const newMsg = await messageModel.create({
        chat: chat._id,
        sender,
        receiver,
        text: message.text?.trim(),
        type,
        mediaUrl: message.mediaUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        duration: message.duration,
      });

      console.log("✅ Message saved:", newMsg._id);

      // Deliver to receiver if online
      const recSockets = await io.in(receiver.toString()).fetchSockets();
      if (recSockets.length > 0) {
        newMsg.delivered = true as any;
        newMsg.deliveredAt = new Date() as any;
        await newMsg.save();
        console.log(`✅ Message delivered to online receiver ${receiver}`);
      }

      // Push notifications
      const friendObj = await user.findById(sender).lean();
      if (friendObj) {
        sendNotification(
          receiver.toString(),
          "New Message",
          message.text || "Attachment",
          String(chat._id),
          {
            _id: String(friendObj._id),
            name: friendObj.name,
            avatar: friendObj.avatar,
            email: friendObj.email,
            username: friendObj.username,
            chatId: String(chat._id),
          }
        );
        console.log(`🔔 Push notification sent to ${receiver}`);
      }

      // Emit message to room & receiver (transform for frontend security)
      const payload = {
        _id: newMsg._id,
        chatId: newMsg.chat,
        type: newMsg.type,
        text: newMsg.text,
        mediaUrl: newMsg.mediaUrl,
        fileName: newMsg.fileName,
        fileSize: newMsg.fileSize,
        // mimeType: newMsg.mimeType,
        duration: newMsg.duration,
        createdAt: newMsg.createdAt,
        deliveredAt: newMsg.deliveredAt,
        readAt: newMsg.readAt,
        userId: newMsg.sender.toString(), // Use userId for frontend (sender)
        roomId,
        tempId,
      };

      socket.broadcast.to(roomId).emit("receiveMessage", payload);
      io.to(receiver.toString()).emit("receiveMessage", payload);

      // Reply to sender for optimistic UI
      if (callback) {
        const senderPayload = {
          _id: newMsg._id,
          chatId: newMsg.chat,
          type: newMsg.type,
          text: newMsg.text,
          mediaUrl: newMsg.mediaUrl,
          fileName: newMsg.fileName,
          fileSize: newMsg.fileSize,
          // mimeType: newMsg.mimeType,
          duration: newMsg.duration,
          createdAt: newMsg.createdAt,
          deliveredAt: newMsg.deliveredAt,
          readAt: newMsg.readAt,
          userId: newMsg.sender.toString(), // Use userId for frontend (sender)
          roomId,
          tempId,
        };
        callback(senderPayload);
      }

      io.to(sender.toString()).emit("messageDelivered", {
        messageId: newMsg._id,
        delivered: !!newMsg.delivered,
        deliveredAt: newMsg.deliveredAt || null,
        tempId,
        chat: newMsg.chat,
      });

      console.log(`📤 messageDelivered emitted back to sender ${sender}`);
    } catch (err) {
      console.error("❌ Error sendMessage:", err);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  }
);


    socket.on("userReconnected", async (userIdFromClient: string) => {
      const uid = userIdFromClient || socket.data.user.id;
      console.log(`🔄 User reconnected: ${uid}`);

      try {
        const undelivered = await messageModel
          .find({ receiver: uid, delivered: false })
          .sort({ createdAt: 1 });

        if (undelivered.length > 0) {
          console.log(
            `🕒 Found ${undelivered.length} undelivered messages for ${uid}`
          );
          (onlineUsers[uid] || []).forEach((sid) =>
            io.to(sid).emit("offlineMessages", undelivered)
          );

          // Mark them as delivered
          await messageModel.updateMany(
            { receiver: uid, delivered: false },
            { $set: { delivered: true, deliveredAt: new Date() } }
          );
          console.log(`✅ Marked undelivered messages as delivered for ${uid}`);
        }
      } catch (err) {
        console.error("❌ Error fetching offline messages:", err);
      }
    });

    // ===== Mark messages as read =====
    socket.on("markAsRead", async ({ chatId, userId }) => {
      console.log(`👁️ markAsRead called by ${userId} for chat ${chatId}`);
      try {
        const msgsToUpdate = (await messageModel
          .find({ chat: chatId, receiver: userId, read: false })
          .lean()) as any[];
        if (!msgsToUpdate.length) return;

        const messageIds = msgsToUpdate.map((m: any) => m._id.toString());
        const uniqueSenders = Array.from(
          new Set(msgsToUpdate.map((m: any) => m.sender.toString()))
        );
        const readAt = new Date();

        await messageModel.updateMany(
          { _id: { $in: messageIds } },
          { $set: { read: true, readAt } }
        );

        uniqueSenders.forEach((senderId) =>
          io.to(senderId).emit("messagesRead", {
            chatId,
            reader: userId,
            messageIds,
            readAt,
          })
        );
        io.to(chatId).emit("messagesRead", {
          chatId,
          reader: userId,
          messageIds,
          readAt,
        });
        console.log(
          `✅ Marked ${messageIds.length} messages as read in chat ${chatId}`
        );
      } catch (err) {
        console.error("❌ Error markAsRead:", err);
      }
    });

    // // ===== Video call events =====
    // socket.on("startVideoCall", async ({ roomId, from, fromName, to }) => {
    //   console.log(`📞 ${fromName} (${from}) calling ${to} — room: ${roomId}`);
    //   const targetSockets = onlineUsers[to] ?? [];
    //   if (!targetSockets.length) {
    //     socket.emit("callUnavailable", { message: "User not available" });
    //     console.log(`❌ Call failed, ${to} not online`);
    //     return;
    //   }

    //   const targetSocketId = targetSockets[0];
    //   const uid = Math.floor(Math.random() * 1e9);
    //   const token = generateAgoraToken(roomId, uid);

    //   io.to(targetSocketId).emit("incomingCall", {
    //     from,
    //     fromName,
    //     channel: roomId,
    //     token,
    //     uid,
    //   });
    //   socket.emit("callInitiated", { channel: roomId, token, uid, to });
    //   console.log(`✅ Call initiated, tokens sent`);
    // });

    socket.on("startVideoCall", ({ roomId, from, fromName, to }) => {
      const targetSockets = onlineUsers[to] ?? [];
      if (!targetSockets.length) return socket.emit("callUnavailable");

      const callerUid = Math.floor(Math.random() * 1e9);
      const calleeUid = Math.floor(Math.random() * 1e9);

      const callerToken = generateAgoraToken(roomId, callerUid);
      const calleeToken = generateAgoraToken(roomId, calleeUid);

      io.to(targetSockets[0]).emit("incomingCall", {
        from,
        fromName,
        channel: roomId,
        token: calleeToken,
        uid: calleeUid,
      });

      // Reply to caller with token + uid
      socket.emit("callInitiated", {
        channel: roomId,
        token: callerToken,
        uid: callerUid,
        to,
      });
    });

    socket.on("acceptCall", ({ to }) => {
      (onlineUsers[to] ?? []).forEach((sid) => io.to(sid).emit("callAccepted"));
    });

    socket.on("acceptCall", ({ channel, to, uid }) => {
      console.log(
        `📞 Call accepted by ${userId} for ${to} in channel ${channel}`
      );
      const targetSockets = onlineUsers[to] ?? [];
      if (!targetSockets.length)
        return socket.emit("callError", { message: "User not connected" });

      const token = generateAgoraToken(channel, uid);
      io.to(targetSockets[0]).emit("callAccepted", { channel, token, uid });
    });

    socket.on("rejectCall", ({ to }) => {
      console.log(`❌ Call rejected by ${userId} for ${to}`);
      (onlineUsers[to] ?? []).forEach((sid) => io.to(sid).emit("callRejected"));
    });

    socket.on("endCall", ({ to }) => {
      console.log(`🛑 Call ended by ${userId} for ${to}`);
      (onlineUsers[to] ?? []).forEach((sid) => io.to(sid).emit("callEnded"));
    });

    // ===== Handle disconnect =====
    socket.on("disconnect", () => {
      console.log(`🔴 Socket disconnected: ${socket.id} (user: ${userId})`);
      for (const uid in onlineUsers) {
        onlineUsers[uid] = onlineUsers[uid].filter((id) => id !== socket.id);
        if (!onlineUsers[uid].length) {
          delete onlineUsers[uid];
          io.emit("userOffline", { userId: uid });
          console.log(`📴 User offline: ${uid}`);
        }
      }
    });
  });
}
