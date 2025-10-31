import express from "express";
import {
  simulateInvestment,
  investInProject,
} from "../controllers/investController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// simulate returns projection for UI
router.post("/simulate", authMiddleware, simulateInvestment);

// actual invest
router.post("/", authMiddleware, investInProject);

export default router;
