import { Request, Response } from "express";
import User from "../models/User";
import callAiForUser from "../utils/aiService";

// POST /api/ai/generate
export const generateAiPortfolio = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.id || req.body.userId;
    if (!uid) return res.status(400).json({ message: "Missing userId" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "User not found" });

    const input = {
      income: user?.income || user?.availableCapital || "unknown",
      goal: user?.investmentGoal || "grow sustainable wealth",
      amount: user?.demoBalance || user?.availableCapital || 0,
      risk: user?.riskAppetite || "Medium",
      sector: user?.preferredSectors?.[0] || undefined,
    };

    const aiRes = await callAiForUser(input);
    const recommendations = aiRes.recommendations || [];

    // Save recommendations to user.aiPortfolio (simple storage)
    user.aiPortfolio = recommendations;
    await user.save();

    res.json({ aiPortfolio: recommendations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "AI generation failed" });
  }
};

export default generateAiPortfolio;
