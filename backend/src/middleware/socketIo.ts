// // src/middleware/socketIo.ts
// import jwt from "jsonwebtoken";
// import { Server, Socket } from "socket.io";

// export function initSocketJwt(io: Server) {
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

//   io.on("connection", (socket: Socket) => {
//     console.log("✅ Socket connected — user:", socket.data.user);
//     // rest of your handlers …
//   });
// }
