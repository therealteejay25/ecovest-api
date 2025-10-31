import { Request, Response } from "express";
import User from "../models/User";
import Investment from "../models/Investment";
import simulateProjection from "../utils/simulator";

// POST /api/invest/simulate
export const simulateInvestment = async (req: Request, res: Response) => {
  try {
    const { recommendation, amount } = req.body;
    if (!recommendation || !amount)
      return res
        .status(400)
        .json({ message: "Missing recommendation or amount" });

    const expectedReturn =
      Number(
        recommendation.expected_return_percent ??
          recommendation.expectedReturn ??
          recommendation.expectedReturnPercent ??
          10
      ) || 10;
    const durationMonths =
      Number(
        recommendation.duration ??
          recommendation.duration_months ??
          recommendation.durationMonths ??
          6
      ) || 6;
    const riskLevel = (recommendation.risk_level ||
      recommendation.risk ||
      "Medium") as any;

    const projection = simulateProjection(
      Number(amount),
      expectedReturn,
      durationMonths,
      riskLevel
    );

    res.json({
      projection,
      summary: {
        initialAmount: amount,
        expectedReturn,
        durationMonths,
        riskLevel,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Simulation failed" });
  }
};

// POST /api/invest
export const investInProject = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.id;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const { recommendationIndex, recommendation, amount } = req.body;
    if (!amount) return res.status(400).json({ message: "Missing amount" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.demoBalance < amount)
      return res.status(400).json({ message: "Insufficient demo balance" });

    let rec = recommendation;
    if (typeof recommendationIndex === "number") {
      rec = (user.aiPortfolio || [])[recommendationIndex];
    }
    if (!rec)
      return res
        .status(400)
        .json({ message: "Recommendation not provided or not found" });

    const expectedReturn =
      Number(
        rec.expected_return_percent ??
          rec.expectedReturn ??
          rec.expectedReturnPercent ??
          10
      ) || 10;
    const durationMonths = Number(rec.duration ?? rec.durationMonths ?? 6) || 6;
    const riskLevel = (rec.risk_level || rec.risk || "Medium") as any;
    const sustainabilityScore =
      Number(rec.sustainability_score ?? rec.sustainabilityScore ?? 80) || 80;

    // create Investment document
    const inv = await Investment.create({
      user: user._id,
      name: rec.name || "AI suggested",
      sector: rec.sector || "General",
      initialAmount: Number(amount),
      currentValue: Number(amount),
      expectedReturn,
      durationMonths,
      riskLevel,
      startDate: new Date(),
      status: "active",
      sustainabilityScore,
    });

    // deduct demo balance and add to user's actualInvestments
    user.demoBalance = Number((user.demoBalance - Number(amount)).toFixed(2));
    user.actualInvestments = user.actualInvestments || [];
    user.actualInvestments.push(inv._id);
    await user.save();

    res.json({
      message: "Investment successful",
      investment: inv,
      demoBalance: user.demoBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error investing" });
  }
};

// POST /api/invest/add
export const addFundsToInvestment = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.id;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const { investmentId, amount } = req.body;
    if (!investmentId || !amount)
      return res
        .status(400)
        .json({ message: "Missing investmentId or amount" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.demoBalance < amount)
      return res.status(400).json({ message: "Insufficient demo balance" });

    const inv = await Investment.findById(investmentId);
    if (!inv) return res.status(404).json({ message: "Investment not found" });
    if (String(inv.user) !== String(user._id))
      return res.status(403).json({ message: "Not your investment" });

    // top up investment
    inv.initialAmount = Number((inv.initialAmount + Number(amount)).toFixed(2));
    inv.currentValue = Number((inv.currentValue + Number(amount)).toFixed(2));
    await inv.save();

    user.demoBalance = Number((user.demoBalance - Number(amount)).toFixed(2));
    await user.save();

    res.json({
      message: "Top-up successful",
      investment: inv,
      demoBalance: user.demoBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error topping up investment" });
  }
};

// POST /api/invest/drop
export const dropInvestment = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.id;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const { investmentId } = req.body;
    if (!investmentId)
      return res.status(400).json({ message: "Missing investmentId" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "User not found" });

    const inv = await Investment.findById(investmentId);
    if (!inv) return res.status(404).json({ message: "Investment not found" });
    if (String(inv.user) !== String(user._id))
      return res.status(403).json({ message: "Not your investment" });

    // credit demoBalance with currentValue and mark investment completed
    const payout = Number(inv.currentValue || inv.initialAmount || 0);
    user.demoBalance = Number((user.demoBalance + payout).toFixed(2));

    // remove from user's actualInvestments array
    user.actualInvestments = (user.actualInvestments || []).filter(
      (id: any) => String(id) !== String(inv._id)
    );

    await user.save();

    inv.status = "completed";
    await inv.save();

    res.json({
      message: "Investment sold",
      payout,
      demoBalance: user.demoBalance,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error selling investment" });
  }
};
