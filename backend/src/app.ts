import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import router from "./routes/authroutes";

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Chat App Backend is running 🚀");
});

// Auth routes
app.use("/api/auth", router); // 👈 mount routes (e.g. /api/auth/register, /api/auth/login)

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI as string, { dbName: "chatapp" })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err: unknown) => console.log("❌ MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
