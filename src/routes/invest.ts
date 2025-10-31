import express from "express";
import {
  simulateInvestment,
  investInProject,
} from "../controllers/investController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Simulate returns projection for UI
router.post("/simulate", authMiddleware, simulateInvestment);

// Actual invest
router.post("/", authMiddleware, investInProject);

// Top-up an existing investment from demo balance
router.post("/add", authMiddleware, (req, res, next) => {
  // forward to controller
  return require("../controllers/investController").addFundsToInvestment(
    req,
    res,
    next
  );
});

// Sell / drop investment (credit demo balance)
router.post("/drop", authMiddleware, (req, res, next) => {
  return require("../controllers/investController").dropInvestment(
    req,
    res,
    next
  );
});

export default router;
