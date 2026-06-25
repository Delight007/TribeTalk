// src/types/socket.d.ts
import { IUser } from "../models/user.model"; // your user interface

declare module "socket.io" {
  interface Socket {
    user?: IUser & { _id: string }; // your user + id
  }
}
