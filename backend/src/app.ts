import cors from "cors";
import express from "express";
import { errorHandler } from "./middleware/error.middleware";
import agoraTokenRouter from "./routes/agoraTokenRoute";
import authRouter from "./routes/authroutes";
import chatRouter from "./routes/chatRoutes";
import fcmRoutes from "./routes/fcmRoutes";
import friendsrouter from "./routes/friends";
import messageRouter from "./routes/messageRoute";
import chatMessage from "./routes/messages";
import postRouters from "./routes/postRoutes";
import sendNotificationRouter from "./routes/sendNotification";
import unreadMessages from "./routes/unreadMessage"; // app.use("/api/messages", messageRouter);
import userRouter from "./routes/userRoutes";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// .. route mounts
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/chats", chatRouter);
app.use("/api/messages", messageRouter);
app.use("/api/chatMessages", chatMessage);
app.use("/api/friends", friendsrouter);
app.use("/api/unreadMessages", unreadMessages);
app.use("/api/save-token", fcmRoutes);
app.use("/api/send-notification", sendNotificationRouter);
app.use("/api/posts", postRouters);

// mount Agora‑token router — choose a path prefix
app.use("/api/agora", agoraTokenRouter);

app.use(errorHandler);

export default app;
