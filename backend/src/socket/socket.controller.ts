import { Server, Socket } from "socket.io";
import chatModel from "../models/chat.model";
import messageModel from "../models/message.model";

interface OnlineUsers {
  [userId: string]: string[];
}

export function initSocket(io: Server) {
  const onlineUsers: OnlineUsers = {};

  io.on("connection", (socket: Socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);

    socket.on("register", (userId: string) => {
      if (!onlineUsers[userId]) onlineUsers[userId] = [];
      onlineUsers[userId].push(socket.id);
      console.log(`✅ Registered: ${userId} → ${onlineUsers[userId]}`);
    });

    socket.on("userReconnected", async (userId: string) => {
      try {
        const undelivered = await messageModel
          .find({ receiver: userId, delivered: false })
          .sort({ createdAt: 1 });

        if (undelivered.length > 0) {
          const sockets = onlineUsers[userId] || [];
          sockets.forEach((sid) =>
            io.to(sid).emit("offlineMessages", undelivered)
          );
          await messageModel.updateMany(
            { receiver: userId, delivered: false },
            { $set: { delivered: true } }
          );
        }
      } catch (err) {
        console.error("❌ Error offline messages:", err);
      }
    });

    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      console.log(`👥 ${socket.id} joined room ${roomId}`);
    });

    socket.on("leaveRoom", (roomId: string) => {
      socket.leave(roomId);
      console.log(`👋 ${socket.id} left room ${roomId}`);
    });

    socket.on("sendMessage", async ({ roomId, message }) => {
      try {
        if (!message) {
          return socket.emit("messageError", {
            error: "Invalid message payload",
          });
        }
        const { sender, receiver, text } = message;
        if (!sender || !receiver || !text) {
          return socket.emit("messageError", { error: "Missing fields" });
        }

        let chat = await chatModel.findOne({
          participants: { $all: [sender, receiver] },
        });
        if (!chat) {
          chat = await chatModel.create({ participants: [sender, receiver] });
        }

        const newMsg = await messageModel.create({
          chat: chat._id,
          sender,
          receiver,
          text,
        });

        const payload = {
          ...newMsg.toObject(),
          time: newMsg.createdAt,
          roomId,
        };

        io.to(roomId).emit("receiveMessage", payload);

        const recSockets = onlineUsers[receiver] || [];
        if (recSockets.length > 0) {
          await messageModel.findByIdAndUpdate(newMsg._id, {
            $set: { delivered: true },
          });
          recSockets.forEach((sid) =>
            io.to(sid).emit("receiveMessage", payload)
          );
        } else {
          console.log(`📭 Receiver ${receiver} offline, saved message`);
        }
      } catch (error) {
        console.error("❌ Error sendMessage:", error);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    socket.on("markAsRead", async ({ chatId, userId }) => {
      try {
        await messageModel.updateMany(
          { chat: chatId, receiver: userId, read: false },
          { $set: { read: true } }
        );
        console.log(`👁️ Chat ${chatId} marked read by ${userId}`);
      } catch (err) {
        console.error("❌ Error markAsRead:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Socket disconnected: ${socket.id}`);
      for (const uid in onlineUsers) {
        onlineUsers[uid] = onlineUsers[uid].filter((id) => id !== socket.id);
        if (onlineUsers[uid].length === 0) delete onlineUsers[uid];
      }
    });
  });
}
