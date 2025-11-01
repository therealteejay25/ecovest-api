import express from "express";
import {
  sendMessage,
  getChatHistory,
  clearHistory,
  getRecommendationAnalysis,
} from "../controllers/chatController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// All chat routes require authentication
router.use(authMiddleware);

// Chat endpoints
router.post("/message", sendMessage);
router.get("/history", getChatHistory);
router.delete("/history", clearHistory);
router.get("/analyze/:recommendationIndex", getRecommendationAnalysis);

export default router;
