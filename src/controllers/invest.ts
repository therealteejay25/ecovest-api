import { Request, Response } from "express";
import { generateInvestmentAdvice } from "../services/aiService";

export const getInvestmentAdvice = async (req:Request, res:Response) => {
    const { income, goal, amount, risk, sector } = req.body;

     if (!income || !goal || !amount || !risk) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const suggestions = await generateInvestmentAdvice({
      income, goal, amount, risk, sector,
    });
    res.json({ success: true, suggestions });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate investment advice" });
  }
}