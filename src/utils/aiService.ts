import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export type AiRecommendation = {
  name: string;
  sector: string;
  description?: string;
  expected_return_percent?: number | string;
  duration?: string | number;
  risk_level?: string;
  minimum_investment?: string | number;
  sustainability_score?: number;
  why_it_fits_user?: string;
  [key: string]: any;
};

const client = new OpenAI({ apiKey: "123123", baseURL: "https://api.algion.dev/v1" });

// Robust JSON extractor: if model wraps JSON in text, try to find the first JSON array/object
const extractJson = (text: string) => {
  const firstBracket = text.indexOf("[");
  const firstBrace = text.indexOf("{");
  const start =
    firstBracket === -1
      ? firstBrace
      : firstBrace === -1
      ? firstBracket
      : Math.min(firstBracket, firstBrace);
  if (start === -1) return null;

  // Try to find a matching closing bracket for array or object
  try {
    const candidate = text.slice(start);
    // Try parse directly
    return JSON.parse(candidate);
  } catch (err) {
    // Fallback: find the last closing bracket and attempt parse
    const lastBracket = text.lastIndexOf("]");
    const lastBrace = text.lastIndexOf("}");
    const end = Math.max(lastBracket, lastBrace);
    if (end <= start) return null;
    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (err2) {
      return null;
    }
  }
};

export const callAiForUser = async (
  userData: any
): Promise<{ recommendations: AiRecommendation[] }> => {
  // Build a careful prompt asking for strict JSON array of recommendation objects.
  const system = `You are a concise AI investment analyst that outputs only JSON. When asked, return an array of investment recommendation objects. Each object must include these fields: name, sector, description, expected_return_percent, duration, risk_level, minimum_investment, sustainability_score, why_it_fits_user. Do not add any extra commentary or markdown.`;

  const user = `USER DATA:\n- income: ${
    userData?.income || "unknown"
  }\n- goal: ${userData?.goal || "grow wealth"}\n- available capital: ${
    userData?.amount || userData?.availableCapital || 0
  }\n- risk appetite: ${userData?.risk || "Medium"}\n- preferred sector: ${
    userData?.sector || "Energy/Agriculture/Water"
  }\n\nReturn 6 recommendations as a JSON array.`;

  try {
    const resp = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const content = resp.choices?.[0]?.message?.content || "";
    // try direct parse first
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      parsed = extractJson(content);
    }

    if (!parsed) {
      // last resort: return an informative fallback recommendation list
      return {
        recommendations: [
          {
            name: "Demo Solar Fund",
            sector: "Energy",
            description:
              "Fallback recommendation: replace with real AI response.",
            expected_return_percent: 12,
            duration: 12,
            risk_level: "Medium",
            minimum_investment: 50000,
            sustainability_score: 85,
            why_it_fits_user: "Fallback recommendation due to parse failure",
          },
        ],
      };
    }

    // normalize into expected shape
    const recommendations: AiRecommendation[] = Array.isArray(parsed)
      ? parsed.map((r: any) => ({
          name: r.name || r.title || "Unnamed",
          sector: r.sector || "General",
          description: r.description || r.desc || "",
          expected_return_percent:
            r.expected_return_percent ??
            r.expectedReturn ??
            r.expected_return ??
            r.expected_return_percent,
          duration: r.duration ?? r.durationMonths ?? r.duration_months,
          risk_level: (r.risk_level ?? r.risk) || "Medium",
          minimum_investment:
            r.minimum_investment ??
            r.minimumInvestment ??
            r.minimum_investment ??
            0,
          sustainability_score:
            r.sustainability_score ?? r.sustainabilityScore ?? 80,
          why_it_fits_user: r.why_it_fits_user || r.whyItFitsUser || "",
          ...r,
        }))
      : [];

    return { recommendations };
  } catch (err) {
    console.error("callAiForUser error", err);
    return { recommendations: [] };
  }
};

export default callAiForUser;
