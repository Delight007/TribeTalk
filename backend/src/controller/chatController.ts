import { Response } from "express";
import mongoose from "mongoose";
import { AuthRequest } from "../middleware/auth"; // assuming this is where AuthRequest is defined
import ChatModel from "../models/chat.model";

// Fetch all chats for a user (with last message preview)

// export async function getChatsForUser(req: AuthRequest, res: Response) {
//   try {
//     const userIdStr = req.userId; // or however you store user ID in request
//     if (!userIdStr) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }
//     const userId = new mongoose.Types.ObjectId(userIdStr);

//     const chats = await ChatModel.aggregate([
//       // Only chats where user participates
//       { $match: { participants: userId } },

//       // Lookup last message document (if chat.lastMessage is set)
//       {
//         $lookup: {
//           from: "messages",
//           localField: "lastMessage",
//           foreignField: "_id",
//           as: "lastMsg",
//         },
//       },
//       {
//         $unwind: {
//           path: "$lastMsg",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       // Count unread messages for this user in each chat
//       {
//         $lookup: {
//           from: "messages",
//           let: { chatId: "$_id" },
//           pipeline: [
//             { $match: { $expr: { $eq: ["$chat", "$$chatId"] } } },
//             { $match: { receiver: userId, read: false } },
//           ],
//           as: "unreadMsgs",
//         },
//       },
//       {
//         $addFields: {
//           unreadCount: { $size: "$unreadMsgs" },
//         },
//       },

//       // Identify the “other participant” (friend) in one-to-one chat
//       {
//         $addFields: {
//           friendIdArr: {
//             $filter: {
//               input: "$participants",
//               cond: { $ne: ["$$this", userId] },
//             },
//           },
//         },
//       },
//       {
//         $unwind: {
//           path: "$friendIdArr",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       // Lookup friend’s user info
//       {
//         $lookup: {
//           from: "users",
//           localField: "friendIdArr",
//           foreignField: "_id",
//           as: "friendArr",
//         },
//       },
//       {
//         $unwind: {
//           path: "$friendArr",
//           preserveNullAndEmptyArrays: true,
//         },
//       },

//       // Project only necessary fields
//       {
//         $project: {
//           _id: 0,
//           chatId: "$_id",
//           isGroup: 1,

//           friend: {
//             _id: "$friendArr._id",
//             name: { $ifNull: ["$friendArr.name", ""] },
//             avatar: { $ifNull: ["$friendArr.avatar", ""] },
//             username: { $ifNull: ["$friendArr.username", ""] },
//             email: { $ifNull: ["$friendArr.email", ""] },
//           },

//           lastMessage: { $ifNull: ["$lastMsg.text", ""] },
//           lastMessageSender: "$lastMsg.sender",
//           lastMessageCreatedAt: "$lastMsg.createdAt",

//           unreadCount: { $ifNull: ["$unreadCount", 0] },
//         },
//       },

//       // Order chats: most recent (by last message time) first
//       {
//         $sort: { lastMessageCreatedAt: -1 },
//       },
//     ]).exec();

//     return res.json({ success: true, data: chats });
//   } catch (error) {
//     console.error("Error in getChatsForUser:", error);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// }

export async function getChatsForUser(req: AuthRequest, res: Response) {
  try {
    const userIdStr = req.userId;
    if (!userIdStr) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const userId = new mongoose.Types.ObjectId(userIdStr);

    const chats = await ChatModel.aggregate([
      // 1) only chats that include this user
      { $match: { participants: userId } },

      // 2) lookup all messages in that chat
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "chat", // or whatever field you use to link message → chat
          as: "allMsgs",
        },
      },

      // 3) unwind messages so we can sort/filter
      { $unwind: "$allMsgs" },

      // 4) sort messages by descending creation date so newest first
      { $sort: { "allMsgs.createdAt": -1 } },

      // 5) group by chat, taking only the first message (i.e. the latest)
      {
        $group: {
          _id: "$_id", // chat _id
          participants: { $first: "$participants" },
          isGroup: { $first: "$isGroup" },
          name: { $first: "$name" },
          avatarUrl: { $first: "$avatarUrl" },
          latestMessage: { $first: "$allMsgs.text" },
          latestMessageSender: { $first: "$allMsgs.sender" },
          latestMessageCreatedAt: { $first: "$allMsgs.createdAt" },
        },
      },

      // 6) Optionally, compute unreadCount for this user (assuming messages have receiver/read flags — adapt as needed)
      {
        $lookup: {
          from: "messages",
          let: { chatId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$chat", "$$chatId"] },
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$read", false] },
                  ],
                },
              },
            },
          ],
          as: "unreadMsgs",
        },
      },
      {
        $addFields: {
          unreadCount: { $size: "$unreadMsgs" },
        },
      },

      // 7) Optionally, lookup participant/user info (if 1-on-1 chat) or you can handle group differently
      // Example for 1-on-1: find the “other” user
      {
        $addFields: {
          friendIds: {
            $filter: {
              input: "$participants",
              cond: { $ne: ["$$this", userId] },
            },
          },
        },
      },
      { $unwind: { path: "$friendIds", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users", // or your user collection name
          localField: "friendIds",
          foreignField: "_id",
          as: "friendArr",
        },
      },
      { $unwind: { path: "$friendArr", preserveNullAndEmptyArrays: true } },

      // 8) Final projection: shape data you send to the client
      {
        $project: {
          _id: 0,
          chatId: "$_id",
          isGroup: 1,
          name: 1,
          avatarUrl: 1,
          latestMessage: 1,
          latestMessageSender: 1,
          latestMessageCreatedAt: 1,
          unreadCount: 1,
          friend: {
            _id: "$friendArr._id",
            name: { $ifNull: ["$friendArr.name", ""] },
            avatar: { $ifNull: ["$friendArr.avatar", ""] },
            username: { $ifNull: ["$friendArr.username", ""] },
            email: { $ifNull: ["$friendArr.email", ""] },
          },
        },
      },

      // 9) Sort chats by latest message time (most recent first)
      { $sort: { latestMessageCreatedAt: -1 } },
    ]).exec();

    return res.json({ success: true, data: chats });
  } catch (error) {
    console.error("Error in getChatsForUser:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
// Create or fetch existing chat between participants (for one-to-one)
export async function getOrCreateChat(req: AuthRequest, res: Response) {
  console.log("POST /chats/one-to-one — body:", req.body);

  try {
    const userIdStr = req.userId;
    if (!userIdStr || !/^[a-fA-F0-9]{24}$/.test(userIdStr)) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized or invalid user ID" });
    }

    const { otherUserId } = req.body;
    if (
      !otherUserId ||
      typeof otherUserId !== "string" ||
      !/^[a-fA-F0-9]{24}$/.test(otherUserId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid otherUserId format" });
    }

    const userId = new mongoose.Types.ObjectId(userIdStr);
    const otherId = new mongoose.Types.ObjectId(otherUserId);

    let chat = await ChatModel.findOne({
      participants: { $all: [userId, otherId] },
      isGroup: false,
    });

    if (!chat) {
      chat = await ChatModel.create({
        participants: [userId, otherId],
        isGroup: false,
      });
    }

    const chatIdStr =
      chat._id instanceof mongoose.Types.ObjectId
        ? chat._id.toString()
        : String(chat._id);

    return res.json({
      success: true,
      data: {
        chatId: chatIdStr,
        participants: chat.participants,
        isGroup: chat.isGroup ?? false,
      },
    });
  } catch (error) {
    console.error("Error in getOrCreateChat:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
}
