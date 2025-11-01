import { Request, Response } from "express";
import { chat, getRecommendationDetails } from "../utils/chatAgent";
import ChatHistory from "../models/ChatHistory";

// Send message to AI chat agent
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const reply = await chat(userId, message);
    res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ message: "Failed to process chat message" });
  }
};

// Get chat history
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const history = await ChatHistory.findOne({ userId })
      .sort("-createdAt")
      .limit(1);

    res.json({ history: history?.messages || [] });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ message: "Failed to fetch chat history" });
  }
};

// Clear chat history
export const clearHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    await ChatHistory.deleteMany({ userId });
    res.json({ message: "Chat history cleared" });
  } catch (err) {
    console.error("Error clearing chat history:", err);
    res.status(500).json({ message: "Failed to clear chat history" });
  }
};

// Get detailed analysis of a specific AI recommendation
export const getRecommendationAnalysis = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.id;
    const { recommendationIndex } = req.params;

    const details = await getRecommendationDetails(
      userId,
      parseInt(recommendationIndex)
    );

    res.json({ details });
  } catch (err) {
    console.error("Error getting recommendation analysis:", err);
    res.status(500).json({ message: "Failed to get recommendation analysis" });
  }
};
