import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";

import app from "./app";
import { connectDB } from "./config/db";
// import { initSocketJwt } from "./middleware/socketIo";
import { initSocket } from "./socket/socket.controller";

dotenv.config();

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB(process.env.MONGO_URI as string, "chatapp");

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket"],
  });

  initSocket(io);
  // initSocketJwt(io);

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("❌ Failed to start server", err);
});
