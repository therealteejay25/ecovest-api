import { Request, Response } from "express";
import User, { InvestmentGoal, RiskTolerance } from "../models/User";

export const updateOnboarding = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.id;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const { investmentGoal, riskTolerance, monthlyIncome } = req.body;

    // Validation
    if (!investmentGoal || !riskTolerance || !monthlyIncome) {
      return res.status(400).json({
        message: "Missing required fields",
        required: ["investmentGoal", "riskTolerance", "monthlyIncome"],
      });
    }

    // Type checks
    if (!["sdg", "profit", "both"].includes(investmentGoal)) {
      return res.status(400).json({
        message: "Invalid investment goal",
        allowed: ["sdg", "profit", "both"],
      });
    }

    if (!["low", "medium", "high"].includes(riskTolerance)) {
      return res.status(400).json({
        message: "Invalid risk tolerance",
        allowed: ["low", "medium", "high"],
      });
    }

    if (typeof monthlyIncome !== "number" || monthlyIncome < 0) {
      return res.status(400).json({
        message: "Monthly income must be a positive number",
      });
    }

    const user = await User.findByIdAndUpdate(
      uid,
      {
        investmentGoal: investmentGoal as InvestmentGoal,
        riskTolerance: riskTolerance as RiskTolerance,
        monthlyIncome,
        onboardingCompleted: true,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Onboarding preferences updated",
      user,
    });
  } catch (err) {
    console.error("Onboarding update error:", err);
    res.status(500).json({ message: "Server error updating preferences" });
  }
};

export const getOnboardingStatus = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.id;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(uid).select(
      "investmentGoal riskTolerance monthlyIncome onboardingCompleted"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      onboardingCompleted: user.onboardingCompleted,
      preferences: user.onboardingCompleted
        ? {
            investmentGoal: user.investmentGoal,
            riskTolerance: user.riskTolerance,
            monthlyIncome: user.monthlyIncome,
          }
        : null,
    });
  } catch (err) {
    console.error("Onboarding status error:", err);
    res
      .status(500)
      .json({ message: "Server error fetching onboarding status" });
  }
};
