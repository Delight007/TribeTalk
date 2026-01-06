// import jwt from "jsonwebtoken";
// import { Server, Socket } from "socket.io";
// import chatModel from "../models/chat.model";
// import messageModel from "../models/message.model";
// import user from "../models/user";
// import { generateAgoraToken } from "../utils/agoraToken";
// import { sendNotification } from "../utils/sendNotification";

// interface OnlineUsers {
//   [userId: string]: string[];
// }

// export function initSocket(io: Server) {
//   io.use((socket: Socket, next: (err?: Error) => void) => {
//     const token = socket.handshake.auth.token as string | undefined;
//     if (!token) {
//       return next(new Error("Authentication error: token missing"));
//     }
//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
//       socket.data.user = decoded; // or (socket as any).user = decoded
//       next();
//     } catch (err) {
//       return next(new Error("Authentication error: invalid token"));
//     }
//   });

//   const onlineUsers: OnlineUsers = {};

//   io.on("connection", (socket: Socket) => {
//     console.log(`🟢 Socket connected: ${socket.id}`);

//     socket.on("register", (userId: string) => {
//       // Track socket id
//       if (!onlineUsers[userId]) onlineUsers[userId] = [];
//       onlineUsers[userId].push(socket.id);

//       // Join a room for this user so we can fetch sockets by userId
//       socket.join(userId);

//       console.log(
//         `✅ Registered & joined room: ${userId} → ${onlineUsers[userId]}`
//       );

//       // Optionally emit to others that this user is online
//       io.emit("userOnline", { userId });
//     });

//     socket.on("userReconnected", async (userId: string) => {
//       console.log(`🔄 User reconnected: ${userId}`);
//       try {
//         const undelivered = await messageModel
//           .find({ receiver: userId, delivered: false })
//           .sort({ createdAt: 1 });

//         if (undelivered.length > 0) {
//           const sockets = onlineUsers[userId] || [];
//           sockets.forEach((sid) =>
//             io.to(sid).emit("offlineMessages", undelivered)
//           );

//           console.log(
//             `🕒 Found ${undelivered.length} undelivered messages for ${userId}`
//           );

//           await messageModel.updateMany(
//             { receiver: userId, delivered: false },
//             { $set: { delivered: true, deliveredAt: new Date() } }
//           );
//         }
//       } catch (err) {
//         console.error("❌ Error offline messages:", err);
//       }
//     });

//     socket.on("joinRoom", (roomId: string) => {
//       socket.join(roomId);
//       console.log(`👥 ${socket.id} joined room ${roomId}`);
//     });

//     socket.on("leaveRoom", (roomId: string) => {
//       socket.leave(roomId);
//       console.log(`👋 ${socket.id} left room ${roomId}`);
//     });

//     socket.on(
//       "sendMessage",
//       async (
//         { roomId, message, tempId }: any,
//         callback?: (msg: any) => void
//       ) => {
//         console.log("sendMessage event received:", { message, tempId });
//         try {
//           if (!message) {
//             return socket.emit("messageError", {
//               error: "Invalid message payload",
//             });
//           }
//           const { sender, receiver, text } = message;
//           if (!sender || !receiver || !text) {
//             return socket.emit("messageError", { error: "Missing fields" });
//           }

//           // Find or create chat
//           let chat = await chatModel.findOne({
//             participants: { $all: [sender, receiver] },
//           });
//           if (!chat) {
//             chat = await chatModel.create({ participants: [sender, receiver] });
//           }

//           // Create and save message
//           const newMsg = await messageModel.create({
//             chat: chat._id,
//             sender,
//             receiver,
//             text,
//           });

//           // **Check online via room named after receiver**
//           const recSockets = await io.in(receiver).fetchSockets();
//           console.log(
//             `🔍 sockets in receiver room (${receiver}):`,
//             recSockets.map((s) => s.id)
//           );
//           // Ensure we have a string chatId (Mongoose ObjectId may be non-string in types)
//           const chatId = (chat as any)?._id ? (chat as any)._id.toString() : "";

//           // Fetch friend object (sender) so you can include in notification
//           // use `lean()` for a plain object and cast to any so we can build the
//           // friend payload with string _id which `sendNotification` expects.
//           const friendObj = (await user.findById(sender).lean()) as any | null;

//           // Build a minimal friend payload with string _id to satisfy the notifier
//           if (!friendObj) {
//             console.warn("Could not find friend object for sender:", sender);
//           } else {
//             const friendPayload = {
//               _id: friendObj._id ? String(friendObj._id) : String(sender),
//               name: friendObj.name || "",
//               avatar: friendObj.avatar || undefined,
//               email: friendObj.email || undefined,
//               username: friendObj.username || undefined,
//               chatId,
//             };

//             // Send push notification
//             sendNotification(
//               receiver,
//               "New Message",
//               text,
//               chatId,
//               friendPayload
//             );
//           }
//           // If receiver is online, mark delivered and set deliveredAt before sending ack
//           if (recSockets.length > 0) {
//             await messageModel.findByIdAndUpdate(newMsg._id, {
//               $set: { delivered: true, deliveredAt: new Date() },
//             });
//             // reflect update in newMsg object
//             newMsg.delivered = true as any;
//             newMsg.deliveredAt = new Date() as any;
//             console.log(`✅ Receiver ${receiver} is online, marked delivered`);
//           } else {
//             console.log(`📭 Receiver ${receiver} offline, saved message`);
//           }

//           // Prepare payload to send
//           const payload = {
//             ...newMsg.toObject(),
//             roomId,
//             // pass back client's temporary id so they can match/replace
//             tempId,
//           };

//           // Broadcast to other sockets in the room (exclude sender)
//           socket.broadcast.to(roomId).emit("receiveMessage", payload);

//           // Emit to receiver user room (if receiver is in their personal room)
//           io.to(receiver).emit("receiveMessage", payload);

//           // Acknowledge sender via callback (replace local placeholder)
//           if (typeof callback === "function") {
//             try {
//               callback(payload);
//             } catch (err) {
//               console.warn("⚠️ sendMessage ack callback failed:", err);
//             }
//           }

//           // Emit a delivery event to sender so their UI can update specific flags
//           try {
//             io.to(sender).emit("messageDelivered", {
//               messageId: newMsg._id,
//               delivered: !!newMsg.delivered,
//               deliveredAt: newMsg.deliveredAt || null,
//               tempId,
//               chat: newMsg.chat,
//             });
//           } catch (err) {
//             console.warn("⚠️ emit messageDelivered failed:", err);
//           }
//         } catch (error) {
//           console.error("❌ Error sendMessage:", error);
//           socket.emit("messageError", { error: "Failed to send message" });
//         }
//       }
//     );

//     socket.on("markAsRead", async ({ chatId, userId }) => {
//       try {
//         // Find messages that will be marked as read so we can notify senders
//         // Use .lean() and cast to any[] so TypeScript knows the shape
//         const msgsToUpdate = (await messageModel
//           .find({
//             chat: chatId,
//             receiver: userId,
//             read: false,
//           })
//           .lean()) as any[];

//         if (msgsToUpdate.length === 0) {
//           return;
//         }

//         const messageIds = msgsToUpdate.map((m: any) => m._id.toString());
//         const uniqueSenders = Array.from(
//           new Set(msgsToUpdate.map((m: any) => m.sender.toString()))
//         );

//         const readAt = new Date();

//         await messageModel.updateMany(
//           { _id: { $in: messageIds } },
//           { $set: { read: true, readAt } }
//         );

//         console.log(
//           `👁️ Marked ${messageIds.length} messages read in chat ${chatId} by ${userId}`
//         );

//         // Notify the senders and the chat room so UIs can update
//         try {
//           uniqueSenders.forEach((senderId) => {
//             io.to(senderId).emit("messagesRead", {
//               chatId,
//               reader: userId,
//               messageIds,
//               readAt,
//             });
//           });

//           // Also emit to the chat room (clients in the chat can listen)
//           io.to(chatId).emit("messagesRead", {
//             chatId,
//             reader: userId,
//             messageIds,
//             readAt,
//           });
//         } catch (err) {
//           console.warn("⚠️ emit messagesRead failed:", err);
//         }
//       } catch (err) {
//         console.error("❌ Error markAsRead:", err);
//       }
//     });

//     socket.on(
//       "startVideoCall",
//       async (data: {
//         roomId: string;
//         from: string;
//         fromName: string;
//         to: string;
//       }) => {
//         const { roomId, from, fromName, to } = data;
//         console.log(`📞 ${fromName} (${from}) calling ${to} — room: ${roomId}`);

//         const targetSockets = onlineUsers[to] ?? [];
//         if (targetSockets.length === 0) {
//           socket.emit("callUnavailable", { message: "User not available" });
//           return;
//         }

//         // Optionally: pick one socket, or notify all
//         const targetSocketId = targetSockets[0];

//         // Decide on a UID for Agora — ideally a numeric ID
//         // Example: parse user ID (if numeric), or map to a numeric UID in your system
//         // For simplicity, here we use a random numeric UID
//         const uid = Math.floor(Math.random() * 1e9); // ensure within valid range

//         // Generate token for callee
//         const token = generateAgoraToken(roomId, uid);

//         io.to(targetSocketId).emit("incomingCall", {
//           from,
//           fromName,
//           channel: roomId,
//           token,
//           uid,
//         });

//         // Also send to caller, so both sides have token/uid/channel
//         socket.emit("callInitiated", {
//           channel: roomId,
//           token,
//           uid,
//           to,
//         });

//         // Optionally implement a timeout: if callee doesn't respond in N sec, send back "callTimeout" to caller.
//         // save some state if needed...
//       }
//     );

//     socket.on(
//       "acceptCall",
//       (data: { channel: string; to: string; uid: number }) => {
//         const { channel, to, uid } = data;
//         const targetSockets = onlineUsers[to] ?? [];
//         if (targetSockets.length === 0) {
//           // maybe callee disconnected
//           socket.emit("callError", { message: "User not connected" });
//           return;
//         }

//         // Generate token for caller side (with same uid and channel)
//         const token = generateAgoraToken(channel, uid);

//         // Notify caller that call is accepted along with token
//         // If "to" is the caller
//         const callerSocketId = targetSockets[0];
//         io.to(callerSocketId).emit("callAccepted", {
//           channel,
//           token,
//           uid,
//         });
//       }
//     );

//     socket.on("rejectCall", (data: { to: string }) => {
//       const { to } = data;
//       const targetSockets = onlineUsers[to] ?? [];
//       targetSockets.forEach((sid) => io.to(sid).emit("callRejected"));
//     });

//     socket.on("endCall", (data: { to: string }) => {
//       const { to } = data;
//       const targetSockets = onlineUsers[to] ?? [];
//       targetSockets.forEach((sid) => io.to(sid).emit("callEnded"));
//     });

//     socket.on("disconnect", () => {
//       console.log(`🔴 Socket disconnected: ${socket.id}`);
//       for (const uid in onlineUsers) {
//         onlineUsers[uid] = onlineUsers[uid].filter((id) => id !== socket.id);
//         if (onlineUsers[uid].length === 0) {
//           delete onlineUsers[uid];
//           // Optionally emit user offline
//           io.emit("userOffline", { userId: uid });
//         }
//       }
//     });
//   });
// }

// src/socket/socket.controller.ts
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import chatModel from "../models/chat.model";
import messageModel from "../models/message.model";
import user from "../models/user";
import { generateAgoraToken } from "../utils/agoraToken";
import { sendNotification } from "../utils/sendNotification";

interface OnlineUsers {
  [userId: string]: string[];
}

export function initSocket(io: Server) {
  const onlineUsers: OnlineUsers = {};

  // ===== JWT authentication middleware =====
  io.use((socket: Socket, next: (err?: Error) => void) => {
    console.log("🟢 New socket handshake auth data:", socket.handshake.auth);
    const token = socket.handshake.auth.token as string | undefined;
    if (!token) {
      console.warn(`❌ Socket ${socket.id} missing token`);
      return next(new Error("Authentication error: token missing"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
      socket.data.user = decoded;
      console.log(`🔑 Socket ${socket.id} authenticated user:`, decoded);
      next();
    } catch (err) {
      console.warn(`❌ Socket ${socket.id} failed JWT verification`);
      return next(new Error("Authentication error: invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;
    console.log(`🟢 Socket connected: ${socket.id} (user: ${userId})`);

    // ===== Register & track sockets =====
    socket.on("register", (userIdFromClient: string) => {
      const uid = userIdFromClient || userId;
      if (!onlineUsers[uid]) onlineUsers[uid] = [];
      onlineUsers[uid].push(socket.id);
      socket.join(uid);
      console.log(`✅ Registered & joined room: ${uid} → ${onlineUsers[uid]}`);
      io.emit("userOnline", { userId: uid });
    });

    // ===== Handle offline messages on reconnection =====
    socket.on("userReconnected", async (userIdFromClient: string) => {
      const uid = userIdFromClient || userId;
      console.log(`🔄 User reconnected: ${uid}`);
      try {
        const undelivered = await messageModel
          .find({ receiver: uid, delivered: false })
          .sort({ createdAt: 1 });

        if (undelivered.length > 0) {
          console.log(
            `🕒 Found ${undelivered.length} undelivered messages for ${uid}`
          );
          (onlineUsers[uid] || []).forEach((sid) =>
            io.to(sid).emit("offlineMessages", undelivered)
          );

          await messageModel.updateMany(
            { receiver: uid, delivered: false },
            { $set: { delivered: true, deliveredAt: new Date() } }
          );
          console.log(`✅ Marked undelivered messages as delivered for ${uid}`);
        }
      } catch (err) {
        console.error("❌ Error fetching offline messages:", err);
      }
    });

    // ===== Join / leave rooms =====
    socket.on("joinRoom", (roomId: string) => {
      socket.join(roomId);
      console.log(`👥 ${socket.id} joined room ${roomId}`);
    });

    socket.on("leaveRoom", (roomId: string) => {
      socket.leave(roomId);
      console.log(`👋 ${socket.id} left room ${roomId}`);
    });

    // ===== Send message =====
    socket.on(
      "sendMessage",
      async (
        { roomId, message, tempId }: any,
        callback?: (msg: any) => void
      ) => {
        console.log(
          `✉️ sendMessage received from ${message?.sender} to ${message?.receiver}:`,
          message?.text
        );
        try {
          if (!message)
            return socket.emit("messageError", {
              error: "Invalid message payload",
            });

          const { sender, receiver, text } = message;
          if (!sender || !receiver || !text) {
            return socket.emit("messageError", { error: "Missing fields" });
          }

          let chat = await chatModel.findOne({
            participants: { $all: [sender, receiver] },
          });
          if (!chat) {
            chat = await chatModel.create({ participants: [sender, receiver] });
            console.log(
              `🆕 Created new chat ${chat._id} for ${sender} & ${receiver}`
            );
          }

          const newMsg = await messageModel.create({
            chat: chat._id,
            sender,
            receiver,
            text,
          });

          const recSockets = await io.in(receiver).fetchSockets();
          const chatId = (chat as any)?._id ? (chat as any)._id.toString() : "";

          // Send push notification
          const friendObj = (await user.findById(sender).lean()) as any | null;
          if (friendObj) {
            sendNotification(receiver, "New Message", text, chatId, {
              _id: String(friendObj._id || sender),
              name: friendObj.name || "",
              avatar: friendObj.avatar || undefined,
              email: friendObj.email || undefined,
              username: friendObj.username || undefined,
              chatId,
            });
            console.log(`🔔 Push notification sent to ${receiver}`);
          }

          if (recSockets.length > 0) {
            await messageModel.findByIdAndUpdate(newMsg._id, {
              $set: { delivered: true, deliveredAt: new Date() },
            });
            newMsg.delivered = true as any;
            newMsg.deliveredAt = new Date() as any;
            console.log(`✅ Message delivered to online receiver ${receiver}`);
          } else {
            console.log(`📭 Receiver ${receiver} offline, message saved`);
          }

          const payload = { ...newMsg.toObject(), roomId, tempId };
          socket.broadcast.to(roomId).emit("receiveMessage", payload);
          io.to(receiver).emit("receiveMessage", payload);
          if (callback) callback(payload);

          io.to(sender).emit("messageDelivered", {
            messageId: newMsg._id,
            delivered: !!newMsg.delivered,
            deliveredAt: newMsg.deliveredAt || null,
            tempId,
            chat: newMsg.chat,
          });
        } catch (err) {
          console.error("❌ Error sendMessage:", err);
          socket.emit("messageError", { error: "Failed to send message" });
        }
      }
    );

    // ===== Mark messages as read =====
    socket.on("markAsRead", async ({ chatId, userId }) => {
      console.log(`👁️ markAsRead called by ${userId} for chat ${chatId}`);
      try {
        const msgsToUpdate = (await messageModel
          .find({ chat: chatId, receiver: userId, read: false })
          .lean()) as any[];
        if (!msgsToUpdate.length) return;

        const messageIds = msgsToUpdate.map((m: any) => m._id.toString());
        const uniqueSenders = Array.from(
          new Set(msgsToUpdate.map((m: any) => m.sender.toString()))
        );
        const readAt = new Date();

        await messageModel.updateMany(
          { _id: { $in: messageIds } },
          { $set: { read: true, readAt } }
        );

        uniqueSenders.forEach((senderId) =>
          io.to(senderId).emit("messagesRead", {
            chatId,
            reader: userId,
            messageIds,
            readAt,
          })
        );
        io.to(chatId).emit("messagesRead", {
          chatId,
          reader: userId,
          messageIds,
          readAt,
        });
        console.log(
          `✅ Marked ${messageIds.length} messages as read in chat ${chatId}`
        );
      } catch (err) {
        console.error("❌ Error markAsRead:", err);
      }
    });

    // // ===== Video call events =====
    // socket.on("startVideoCall", async ({ roomId, from, fromName, to }) => {
    //   console.log(`📞 ${fromName} (${from}) calling ${to} — room: ${roomId}`);
    //   const targetSockets = onlineUsers[to] ?? [];
    //   if (!targetSockets.length) {
    //     socket.emit("callUnavailable", { message: "User not available" });
    //     console.log(`❌ Call failed, ${to} not online`);
    //     return;
    //   }

    //   const targetSocketId = targetSockets[0];
    //   const uid = Math.floor(Math.random() * 1e9);
    //   const token = generateAgoraToken(roomId, uid);

    //   io.to(targetSocketId).emit("incomingCall", {
    //     from,
    //     fromName,
    //     channel: roomId,
    //     token,
    //     uid,
    //   });
    //   socket.emit("callInitiated", { channel: roomId, token, uid, to });
    //   console.log(`✅ Call initiated, tokens sent`);
    // });

    socket.on("startVideoCall", ({ roomId, from, fromName, to }) => {
      const targetSockets = onlineUsers[to] ?? [];
      if (!targetSockets.length) return socket.emit("callUnavailable");

      const callerUid = Math.floor(Math.random() * 1e9);
      const calleeUid = Math.floor(Math.random() * 1e9);

      const callerToken = generateAgoraToken(roomId, callerUid);
      const calleeToken = generateAgoraToken(roomId, calleeUid);

      io.to(targetSockets[0]).emit("incomingCall", {
        from,
        fromName,
        channel: roomId,
        token: calleeToken,
        uid: calleeUid,
      });

      // Reply to caller with token + uid
      socket.emit("callInitiated", {
        channel: roomId,
        token: callerToken,
        uid: callerUid,
        to,
      });
    });

    socket.on("acceptCall", ({ to }) => {
      (onlineUsers[to] ?? []).forEach((sid) => io.to(sid).emit("callAccepted"));
    });

    socket.on("acceptCall", ({ channel, to, uid }) => {
      console.log(
        `📞 Call accepted by ${userId} for ${to} in channel ${channel}`
      );
      const targetSockets = onlineUsers[to] ?? [];
      if (!targetSockets.length)
        return socket.emit("callError", { message: "User not connected" });

      const token = generateAgoraToken(channel, uid);
      io.to(targetSockets[0]).emit("callAccepted", { channel, token, uid });
    });

    socket.on("rejectCall", ({ to }) => {
      console.log(`❌ Call rejected by ${userId} for ${to}`);
      (onlineUsers[to] ?? []).forEach((sid) => io.to(sid).emit("callRejected"));
    });

    socket.on("endCall", ({ to }) => {
      console.log(`🛑 Call ended by ${userId} for ${to}`);
      (onlineUsers[to] ?? []).forEach((sid) => io.to(sid).emit("callEnded"));
    });

    // ===== Handle disconnect =====
    socket.on("disconnect", () => {
      console.log(`🔴 Socket disconnected: ${socket.id} (user: ${userId})`);
      for (const uid in onlineUsers) {
        onlineUsers[uid] = onlineUsers[uid].filter((id) => id !== socket.id);
        if (!onlineUsers[uid].length) {
          delete onlineUsers[uid];
          io.emit("userOffline", { userId: uid });
          console.log(`📴 User offline: ${uid}`);
        }
      }
    });
  });
}
