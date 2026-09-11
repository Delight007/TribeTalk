import express from "express";
import {
  getActivities,
  markActivitiesRead,
} from "../controller/activityController";
import { authenticate } from "../middleware/auth";

const activityRouter = express.Router();
activityRouter.get("/", authenticate, getActivities);
activityRouter.post("/read", authenticate, markActivitiesRead);

export default activityRouter;
