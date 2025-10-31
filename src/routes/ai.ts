import express from "express";
import { generateAiPortfolio } from "../controllers/aiController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/generate", authMiddleware, generateAiPortfolio);

export default router;
