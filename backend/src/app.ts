import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import chatModel from "./models/chat.model";
import messageModel from "./models/message.model";
import authRouter from "./routes/authroutes";
import chatRouter from "./routes/chatRoutes";
import friendsRouter from "./routes/friends";
import messageRouter from "./routes/messageRoute";
import userRouter from "./routes/userRoutes";
import { generateAgoraToken } from "./utils/agoraToken";
import chatMessage from "./routes/messages";

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["websocket"],
});

// Middleware
app.use(cors());
app.use(express.json());

// --- API Routes ---
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/chats", chatRouter);
app.use("/api/messages", messageRouter);
app.use("/api/chatMessages", chatMessage);
app.use("/api/friends", friendsRouter);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI as string, { dbName: "chatapp" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Socket.IO Online Users Tracking ---
interface OnlineUsers {
  [userId: string]: string[]; // userId -> array of socketIds (supports multiple devices)
}
const onlineUsers: OnlineUsers = {};

// --- Socket.IO Events ---
io.on("connection", (socket) => {
  console.log(`🟢 New connection: ${socket.id}`);

  // Register user
  socket.on("register", (userId: string) => {
    if (!onlineUsers[userId]) onlineUsers[userId] = [];
    onlineUsers[userId].push(socket.id);
    console.log(`✅ Registered user: ${userId} → ${onlineUsers[userId]}`);
  });

  // Join chat room
  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    console.log(`👥 ${socket.id} joined room ${roomId}`);
  });

  // Leave chat room
  socket.on("leaveRoom", (roomId: string) => {
    socket.leave(roomId);
    console.log(`👋 ${socket.id} left room ${roomId}`);
  });

  // Send message
  socket.on("sendMessage", async ({ roomId, message }) => {
    try {
      if (!message) {
        console.error("❌ Received undefined message payload");
        return socket.emit("messageError", { error: "Invalid message format" });
      }

      const { sender, receiver, text } = message;
      if (!sender || !receiver || !text) {
        console.error("❌ Missing message fields:", message);
        return socket.emit("messageError", { error: "Missing message fields" });
      }

      // 🔹 Find or create chat
      let chat = await chatModel.findOne({
        participants: { $all: [sender, receiver] },
      });

      if (!chat) {
        chat = await chatModel.create({
          participants: [sender, receiver],
        });
        console.log("🆕 Created new chat:", chat._id);
      }

      // 🔹 Save message to DB
      const newMessage = new messageModel({
        chat: chat._id,
        sender: sender,
        receiver: receiver,
        text,
      });
      console.log(newMessage);

      const savedMessage = await newMessage.save();

      const msgWithTime = {
        ...savedMessage.toObject(),
        time: savedMessage.createdAt,
        roomId,
      };

      // 🔸 Emit to users
      io.to(roomId).emit("receiveMessage", msgWithTime);

      const recipientSockets = onlineUsers[receiver] || [];
      recipientSockets.forEach((sockId) =>
        io.to(sockId).emit("receiveMessage", msgWithTime)
      );

      console.log("💾 Message saved and broadcasted:", savedMessage._id);
    } catch (error) {
      console.error("❌ Error saving message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Video call events
  socket.on("startVideoCall", ({ roomId, from, fromName, to }) => {
    const targetSockets = onlineUsers[to] || [];
    if (targetSockets.length === 0) {
      socket.emit("callUnavailable", { message: "User not online" });
      return;
    }
    const token = generateAgoraToken(roomId, to);
    targetSockets.forEach((sockId) => {
      io.to(sockId).emit("incomingCall", {
        from: fromName,
        fromId: from,
        channel: roomId,
        token,
      });
    });
  });

  socket.on("acceptCall", ({ to, channel, uid }) => {
    const token = generateAgoraToken(channel, uid);
    const targetSockets = onlineUsers[to] || [];
    targetSockets.forEach((sockId) =>
      io.to(sockId).emit("callAccepted", { channel, token })
    );
  });

  socket.on("rejectCall", ({ to }) => {
    const targetSockets = onlineUsers[to] || [];
    targetSockets.forEach((sockId) => io.to(sockId).emit("callRejected"));
  });

  socket.on("endCall", ({ to }) => {
    const targetSockets = onlineUsers[to] || [];
    targetSockets.forEach((sockId) => io.to(sockId).emit("callEnded"));
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
    for (const userId in onlineUsers) {
      onlineUsers[userId] = onlineUsers[userId].filter(
        (id) => id !== socket.id
      );
      if (onlineUsers[userId].length === 0) delete onlineUsers[userId];
    }
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
