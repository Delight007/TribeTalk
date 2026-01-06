// server/src/routes/agoraToken.ts
import express, { Request, Response } from "express";
import { authenticate } from "../middleware/auth";
import { generateAgoraToken } from "../utils/agoraToken";

const agoraTokenRouter = express.Router();

agoraTokenRouter.post("/token", authenticate, (req: Request, res: Response) => {
  const { channelName, uid } = req.body;

  // Basic input validation
  if (typeof channelName !== "string" || !channelName.trim()) {
    return res
      .status(400)
      .json({ error: "channelName must be a non-empty string" });
  }
  if (typeof uid !== "string" && typeof uid !== "number") {
    return res
      .status(400)
      .json({ error: "uid must be provided as a string or number" });
  }

  try {
    const token = generateAgoraToken(channelName, uid);
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ rtcToken: token });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return res.status(500).json({ error: "Failed to generate token" });
  }
});
export default agoraTokenRouter;
