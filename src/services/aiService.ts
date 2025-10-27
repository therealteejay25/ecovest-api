import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: '123123',
    baseURL: 'https://api.algion.dev/v1'
});

type InvestmentQuery = {
    income: string;
    goal: string;
    amount: string;
    risk: "low" | "medium" | "high";
    sector?: string;
}

export const generateInvestmentAdvice = async (data: InvestmentQuery) => {
    const prompt = `
You are a Nigerian AI Investment Analyst specialized in Sustainable Development Goals (SDGs). 
Your job is to recommend investment opportunities and startups in sectors such as:
- Clean Energy
- Agriculture & Food Preservation
- Water & Sanitation
- Circular Economy

You DO NOT chat with the user — instead, you generate structured recommendations as data cards.

---

## USER DATA
- Income: ${data.income}
- Investment Goal: ${data.goal}
- Available Capital: ₦${data.amount}
- Risk Appetite: ${data.risk}
- Preferred Sector: ${data.sector || "energy/agriculture/water"}

---

## INSTRUCTIONS
1. Return exactly **10 investment recommendations** in Nigeria that align with the above data.
2. Focus ONLY on sustainable or impact-driven investments (energy, agriculture, water, recycling, etc.).
3. Each recommendation should be structured with **these 15 fields**:

{
  "name": "",
  "sector": "",
  "description": "",
  "expected_return_percent": "",
  "duration": "",
  "risk_level": "",
  "minimum_investment": "",
  "investor_count": "",
  "average_rating": "",
  "location": "",
  "impact_focus": "",
  "organization_type": "",
  "verified_by": "",
  "website_or_platform": "",
  "why_it_fits_user": ""
}

4. Be realistic — use known or probable data from the Nigerian market (e.g. companies like Renewvia, Farmcrowdy, ThriveAgric, Arnergy, etc.)
5. Always include at least one recommendation from each of the 3 core SDG sectors: 
   - Energy 
   - Agriculture/Food
   - Water/Sanitation
6. Output clean JSON or a visually structured text block suitable for rendering as cards.
7. Never ask questions or include chatty text — only return results.

---

## OUTPUT EXAMPLE
[
  {
    "name": "Arnergy Solar Investment Plan",
    "sector": "Clean Energy",
    "description": "A renewable energy company providing solar solutions for homes and SMEs across Nigeria.(description should be up to 500 words)",
    "expected_return_percent": "15%",
    "duration": "12 months",
    "risk_level": "Low",
    "minimum_investment": "₦50,000",
    "investor_count": "4,200+",
    "average_rating": "4.6/5",
    "location": "Lagos, Nigeria",
    "impact_focus": "Affordable Clean Energy (SDG 7)",
    "organization_type": "Private Startup",
    "verified_by": "NSE & AllOn",
    "website_or_platform": "https://www.arnergy.com",
    "why_it_fits_user": "Stable low-risk renewable investment aligned with user’s sustainable focus."
  },
  ...
]

---

Return the output only in this structure — no introductions, no extra commentary.
`;


   const response = await openai.chat.completions.create({
    model: "gpt-4-0125-preview",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0]?.message?.content || "No advice generated.";
  return content;
}