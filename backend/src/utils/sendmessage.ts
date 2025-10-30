import { Types } from "mongoose";
import chatModel from "../models/chat.model";
import messageModel from "../models/message.model";

export async function SaveMessageToDB(message: {
  senderId: string;
  receiverId: string;
  text: string;
}) {
  try {
    const senderObjectId = new Types.ObjectId(message.senderId);
    const receiverObjectId = new Types.ObjectId(message.receiverId);

    // Find or create the chat between these users
    let chat = await chatModel.findOne({
      participants: { $all: [senderObjectId, receiverObjectId] },
    });

    if (!chat) {
      chat = await chatModel.create({
        participants: [senderObjectId, receiverObjectId],
      });
    }

    // Save message
    const newMessage = await messageModel.create({
      chat: chat._id,
      sender: senderObjectId,
      receiver: receiverObjectId,
      text: message.text,
    });

    console.log("✅ Message saved to DB:", newMessage._id);
    return newMessage;
  } catch (err) {
    console.error("❌ Error saving message to DB:", err);
  }
}
