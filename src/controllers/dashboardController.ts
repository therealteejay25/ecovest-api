import { Request, Response } from "express";
import User from "../models/User";
import Investment from "../models/Investment";

// GET /dashboard/:userId  (protected)
export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId || (req as any).user?.id;
    if (!userId) return res.status(400).json({ message: "Missing userId" });

    const user = await User.findById(userId).populate("actualInvestments");
    if (!user) return res.status(404).json({ message: "User not found" });

    const investments = (user.actualInvestments as any[]) || [];

    const portfolioValue = investments.reduce(
      (sum, inv) => sum + (inv.currentValue || inv.initialAmount || 0),
      0
    );
    const invested = investments.reduce(
      (sum, inv) => sum + (inv.initialAmount || 0),
      0
    );
    const predictedGrowth =
      investments.length > 0
        ? investments.reduce((sum, inv) => sum + (inv.expectedReturn || 0), 0) /
          investments.length
        : 0;
    const sustainabilityScore =
      investments.length > 0
        ? Math.round(
            investments.reduce(
              (sum, inv) => sum + (inv.sustainabilityScore || 80),
              0
            ) / investments.length
          )
        : 0;

    res.json({
      fullName: user.fullName,
      demoBalance: user.demoBalance,
      portfolioValue,
      invested,
      predictedGrowth,
      sustainabilityScore,
      investments,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
