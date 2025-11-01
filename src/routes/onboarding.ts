import express from "express";
import {
  updateOnboarding,
  getOnboardingStatus,
} from "../controllers/onboardingController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Both routes require authentication
router.use(authMiddleware);

// Get current onboarding status and preferences
router.get("/status", getOnboardingStatus);

// Update onboarding preferences
router.post("/update", updateOnboarding);

export default router;
