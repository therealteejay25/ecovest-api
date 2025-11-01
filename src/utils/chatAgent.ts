import { OpenAI } from "openai";
import User from "../models/User";
import Investment from "../models/Investment";
import ChatHistory from "../models/ChatHistory";
import { simulateProjection } from "./simulator";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: "123123",
  baseURL: "https://api.algion.dev/v1",
});

/**
 * Formats user data and context into a string for the AI
 */
async function getUserContext(userId: string) {
  try {
    // Get user and their investments
    const user = await User.findById(userId).select(
      "fullName email demoBalance aiPortfolio investmentGoal riskTolerance monthlyIncome onboardingCompleted"
    );
    const investments = await Investment.find({ user: userId });

    // Calculate total portfolio value
    const portfolioValue = investments.reduce(
      (sum, inv) => sum + (inv.currentValue || 0),
      0
    );

    // Format context string
    let context = `
USER PROFILE:
Name: ${user?.fullName}
Demo Balance: ₦${user?.demoBalance?.toLocaleString()}
Portfolio Value: ₦${portfolioValue.toLocaleString()}
Investment Goal: ${user?.investmentGoal || "Not set"} ${
      user?.investmentGoal === "sdg"
        ? "(Focus on Sustainable Development Goals)"
        : user?.investmentGoal === "profit"
        ? "(Focus on Maximum Returns)"
        : user?.investmentGoal === "both"
        ? "(Balance SDG Impact & Returns)"
        : ""
    }
Risk Tolerance: ${user?.riskTolerance || "Not set"}
Monthly Income: ${
      user?.monthlyIncome
        ? `₦${user.monthlyIncome.toLocaleString()}`
        : "Not set"
    }

CURRENT INVESTMENTS:
${investments
  .map(
    (inv) =>
      `- ${
        inv.projectName || "Investment"
      }: ₦${inv.currentValue?.toLocaleString()} (Expected Return: ${
        inv.expectedReturn
      }%, Risk: ${inv.riskLevel})`
  )
  .join("\n")}

AI PORTFOLIO RECOMMENDATIONS:
${
  user?.aiPortfolio
    ?.map(
      (rec: any, i: number) =>
        `${i + 1}. ${rec.project_name || "Investment Option"} (Return: ${
          rec.expected_return_percent
        }%, Risk: ${rec.risk_level})`
    )
    .join("\n") || "No recommendations yet"
}
`;
    return context.trim();
  } catch (err) {
    console.error("Error getting user context:", err);
    return "Error loading user context";
  }
}

/**
 * Formats investment simulation results
 */
async function getSimulationInsight(recommendation: any) {
  try {
    const amount = 100000; // Use a standard amount for simulation
    const projection = await simulateProjection({
      expectedReturn: recommendation.expected_return_percent,
      duration: recommendation.duration || 12,
      amount,
      riskLevel: recommendation.risk_level,
    });

    return `
SIMULATION INSIGHT (₦100,000 investment):
- Projected value after ${recommendation.duration || 12} months: ₦${projection[
      projection.length - 1
    ].value.toLocaleString()}
- Monthly projection shows ${
      projection.filter((p) => p.value > amount).length
    } months with positive returns
- Maximum projected value: ₦${Math.max(
      ...projection.map((p) => p.value)
    ).toLocaleString()}
- Minimum projected value: ₦${Math.min(
      ...projection.map((p) => p.value)
    ).toLocaleString()}
`.trim();
  } catch (err) {
    console.error("Error in simulation:", err);
    return "";
  }
}

/**
 * Get recent chat history
 */
async function getRecentHistory(userId: string, limit = 10) {
  const history = await ChatHistory.findOne({ userId })
    .sort("-createdAt")
    .limit(1);

  if (!history) return [];
  return history.messages.slice(-limit);
}

/**
 * Main chat function that handles user messages
 */
export async function chat(userId: string, message: string) {
  try {
    // Get user context and recent chat history
    const [context, recentMessages] = await Promise.all([
      getUserContext(userId),
      getRecentHistory(userId),
    ]);

    // Prepare messages for OpenAI
    const messages = [
      {
        role: "system",
        content: `You are EcovestAI, a helpful investment advisor chatbot for Ecovest. You have access to the user's profile, investment portfolio, and AI recommendations.
        
When discussing investments and recommendations:
- Align suggestions with the user's investment goal (SDG impact, profit, or both)
- Match investment risk levels with user's stated risk tolerance
- Consider monthly income when suggesting investment amounts
- Suggest diversification while respecting risk tolerance
- Highlight SDG impacts for users interested in sustainable investing
- Remind users this is a demo/simulation environment
- Use proper currency formatting (₦) for Nigerian Naira
- Be friendly but professional
- Keep responses concise and focused

Investment Preferences Guide:
- For SDG-focused users: Emphasize environmental and social impact
- For profit-focused users: Focus on highest returns within risk tolerance
- For balanced users: Show both SDG impact and financial returns
- Risk Tolerance:
  * Low: Safer investments, more bonds, lower volatility
  * Medium: Balanced portfolio, moderate growth
  * High: Growth-focused, can handle volatility
- Suggested monthly investment: 10-30% of stated monthly income

Here is the current user context:

${context}`,
      },
      // Add recent messages for context
      ...recentMessages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      { role: "user", content: message },
    ];

    // Call OpenAI
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    const reply =
      response.choices[0]?.message?.content ||
      "I apologize, but I'm having trouble generating a response right now.";

    // Save to chat history
    await ChatHistory.findOneAndUpdate(
      { userId },
      {
        $push: {
          messages: [
            { role: "user", content: message, timestamp: new Date() },
            { role: "assistant", content: reply, timestamp: new Date() },
          ],
        },
      },
      { upsert: true, new: true }
    );

    return reply;
  } catch (err) {
    console.error("Chat error:", err);
    throw new Error("Failed to process chat message");
  }
}

/**
 * Gets AI recommendation details with simulation
 */
export async function getRecommendationDetails(
  userId: string,
  recommendationIndex: number
) {
  try {
    const user = await User.findById(userId);
    const recommendation = user?.aiPortfolio?.[recommendationIndex];

    if (!recommendation) {
      return "I cannot find that specific recommendation. Please ask for available investment recommendations first.";
    }

    const simulation = await getSimulationInsight(recommendation);

    return `
RECOMMENDATION DETAILS:
Project: ${recommendation.project_name}
Expected Return: ${recommendation.expected_return_percent}%
Risk Level: ${recommendation.risk_level}
Duration: ${recommendation.duration || 12} months
Minimum Investment: ₦${
      recommendation.minimum_investment?.toLocaleString() || "50,000"
    }

${simulation}

Investment Strategy:
${
  recommendation.strategy ||
  "This investment follows a balanced approach to achieve the target return while managing risk exposure."
}
`.trim();
  } catch (err) {
    console.error("Error getting recommendation details:", err);
    return "Sorry, I had trouble retrieving the recommendation details.";
  }
}
