import express from "express";
import { getDashboard } from "../controllers/dashboardController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Protected dashboard route
router.get("/:userId", authMiddleware, getDashboard);

export default router;
