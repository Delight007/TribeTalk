import admin from "../firebaseAdmin";
import User from "../models/user";

export async function sendNotification(
  userId: string,
  title: string,
  body: string,
  chatId: string, // ← add chatId
  friend: {
    _id: string;
    name: string;
    avatar?: string;
    email?: string;
    username?: string;
    chatId?: string;
  }
) {
  try {
    const user = await User.findById(userId);

    if (!user || !user.fcmToken) {
      console.log("❌ No FCM token for user", userId);
      return;
    }

    const message: admin.messaging.Message = {
      token: user.fcmToken,
      notification: { title, body },
      android: { priority: "high" },
      data: {
        screen: "ChatScreen",
        chatId: chatId,
        friend: JSON.stringify(friend), // convert friend object to string
      },
    };

    await admin.messaging().send(message);

    console.log("📩 Push notification sent to", userId);
  } catch (error) {
    console.error("❌ Failed to send notification:", error);
  }
}
