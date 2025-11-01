import express from "express";
import {
  simulateInvestment,
  investInProject,
} from "../controllers/investController";
const investCtrl = require("../controllers/investController");
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Simulate returns projection for UI
router.post("/simulate", authMiddleware, simulateInvestment);

// Actual invest
router.post("/", authMiddleware, investInProject);

// Top-up an existing investment from demo balance
router.post("/add", authMiddleware, (req, res, next) => {
  // forward to controller
  return investCtrl.addFundsToInvestment(req, res, next);
});

// Sell / drop investment (credit demo balance)
router.post("/drop", authMiddleware, (req, res, next) => {
  return investCtrl.dropInvestment(req, res, next);
});

// Partial or full sell
router.post("/sell", authMiddleware, (req, res, next) => {
  return investCtrl.sellInvestment(req, res, next);
});

// Admin toggle fluctuate
router.post("/admin/toggle-fluctuate", authMiddleware, (req, res, next) => {
  return investCtrl.toggleFluctuate(req, res, next);
});

export default router;
