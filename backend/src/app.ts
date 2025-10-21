import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import authRouter from "./routes/authroutes";
import chatRouter from "./routes/chatRoutes";
import friendsRouter from "./routes/friends";
import messageRouter from "./routes/messageRoute";
import userRouter from "./routes/userRoutes";
import { generateAgoraToken } from "./utils/agoraToken";

dotenv.config();
console.log("AGORA_APP_ID:", process.env.AGORA_APP_ID);
console.log("AGORA_APP_CERTIFICATE:", process.env.AGORA_APP_CERTIFICATE);

const app = express();
const server = http.createServer(app);

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// --- Middleware ---
app.use(express.json());
app.use(cors());

// --- API Routes ---
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/chats", chatRouter);
app.use("/api/messages", messageRouter);
app.use("/api/friends", friendsRouter);

// --- MongoDB Connection ---
mongoose
  .connect(process.env.MONGO_URI as string, { dbName: "chatapp" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Track Online Users ---
interface OnlineUsers {
  [userId: string]: string; // userId -> socketId
}
const onlineUsers: OnlineUsers = {};

// --- Socket.IO Core Logic ---
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  // 1️⃣ Register user
  socket.on("register", (userId: string) => {
    onlineUsers[userId] = socket.id;
    console.log(`✅ Registered user: ${userId} → ${socket.id}`);
  });

  // 2️⃣ Join a chat room
  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    console.log(`👥 User ${socket.id} joined room ${roomId}`);
  });

  // 3️⃣ Handle chat messages
  socket.on("sendMessage", ({ roomId, message }) => {
    io.to(roomId).emit("receiveMessage", {
      ...message,
      time: new Date().toISOString(),
    });
  });

  // ==============================================================
  // 🟩 VIDEO CALL SYSTEM (FULL FLOW)
  // ==============================================================

  // --- Caller starts a video call ---
  socket.on(
    "startVideoCall",
    async ({
      roomId,
      from,
      fromName,
      to,
    }: {
      roomId: string;
      from: string;
      fromName: string;
      to: string;
    }) => {
      console.log(
        `📞 ${fromName} (${from}) is calling ${to} in room ${roomId}`
      );

      const targetSocket = onlineUsers[to];
      if (!targetSocket) {
        console.log("❌ Receiver not online");
        socket.emit("callUnavailable", { message: "User not available" });
        return;
      }

      // Generate Agora token for receiver
      const token = generateAgoraToken(roomId, to);

      // Notify receiver
      io.to(targetSocket).emit("incomingCall", {
        from: fromName,
        fromId: from,
        channel: roomId,
        token,
      });
    }
  );

  // --- Receiver accepts the call ---
  socket.on(
    "acceptCall",
    ({ to, channel, uid }: { to: string; channel: string; uid: string }) => {
      console.log(`✅ ${uid} accepted call from ${to}`);
      const token = generateAgoraToken(channel, uid);
      const targetSocket = onlineUsers[to];
      if (targetSocket) {
        io.to(targetSocket).emit("callAccepted", { channel, token });
      }
    }
  );

  // --- Receiver declines the call ---
  socket.on("rejectCall", ({ to }: { to: string }) => {
    console.log("❌ Call rejected");
    const targetSocket = onlineUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit("callRejected");
    }
  });

  // --- Either user ends the call ---
  socket.on("endCall", ({ to }: { to: string }) => {
    console.log("📴 Call ended");
    const targetSocket = onlineUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit("callEnded");
    }
  });

  // --- Disconnect handler ---
  socket.on("disconnect", () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        console.log(`🔴 User ${userId} disconnected`);
        break;
      }
    }
  });
});

// ================================================================
// 🧩 API Route: Generate Agora Token
// ================================================================
app.get("/api/agora/token/:channel", (req, res) => {
  const { channel } = req.params;
  const uid = Math.floor(Math.random() * 10000).toString();
  try {
    const token = generateAgoraToken(channel, uid);
    return res.json({ token });
  } catch (error) {
    console.error("Error generating token:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});

// ================================================================
// 🚀 Start the Server
// ================================================================
const PORT = Number(process.env.PORT) || 5000;
server.listen(PORT, "0.0.0.0", () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
