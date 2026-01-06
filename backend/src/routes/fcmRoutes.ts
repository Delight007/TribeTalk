import express, { Request, Response } from "express"; // ✅ import Request and Response properly
import User from "../models/user"; // make sure 'User' is the Mongoose model, not 'user'

const fcmRoutes = express.Router();

fcmRoutes.post("/", async (req: Request, res: Response) => {
  try {
    // ✅ TypeScript now knows req.body is an object
    const { userId, fcmToken }: { userId: string; fcmToken: string } = req.body;

    if (!userId || !fcmToken) {
      return res.status(400).json({ message: "Missing userId or token" });
    }

    console.log("Updating token for userId:", userId);

    const updated = await User.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    );

    console.log("Updated user:", updated);

    console.log("✅ Token saved for user:", userId);
    res.status(200).json({ message: "FCM token saved successfully" });
  } catch (err) {
    console.error("Error saving FCM token:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default fcmRoutes;
