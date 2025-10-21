import { IUser } from "../../models/user"; // adjust path if needed

declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: string }; // 👈 tells TS that req.user exists and has an _id
    }
  }
}
