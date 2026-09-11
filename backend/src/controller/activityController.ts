import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import Activity from "../models/activity";

export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const activities = await Activity.find({ recipient: req.userId })
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

export const markActivitiesRead = async (req: AuthRequest, res: Response) => {
  try {
    await Activity.updateMany(
      { recipient: req.userId, read: false },
      { read: true },
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};
