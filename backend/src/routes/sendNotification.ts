import { Request, Response, Router } from "express";
import admin from "../firebaseAdmin";
import User from "../models/user";

const sendNotificationRouter = Router();

sendNotificationRouter.post("/", async (req: Request, res: Response) => {
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await User.findById(userId);

    if (!user || !user.fcmToken) {
      return res.status(400).json({ error: "User has no FCM token saved" });
    }

    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: {
        title,
        body,
      },
      android: {
        priority: "high",
      },
      data: {
        click_action: "FLUTTER_NOTIFICATION_CLICK",
        screen: "ChatScreen",
      },
    };

    const response = await admin.messaging().send(message);

    return res.json({ success: true, response });
  } catch (error) {
    console.error("Send notification error:", error);
    return res.status(500).json({ error: "Failed to send notification" });
  }
});

export default sendNotificationRouter;
