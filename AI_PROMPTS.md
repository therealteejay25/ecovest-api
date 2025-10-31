# Best-practice OpenAI prompts for Ecovest (structured JSON output)

These prompts are tuned to get reliably structured JSON output from the model describing investment recommendations tailored to a Nigerian sustainable-investment context.

General guidance

- Use a strict system instruction: require JSON only and list exact fields.
- Provide explicit examples and a short schema.
- Ask the model to avoid any additional text or markdown.
- Use temperature 0.0-0.7 depending on how creative you want recommendations to be. For repeatable outputs use 0-0.3; for variety use 0.7.

Prompt (conservative, structured):

```
System: You are an investment analyst. Output ONLY a JSON array of recommendation objects. Each object MUST contain these fields: name, sector, description, expected_return_percent, duration_months, risk_level, minimum_investment, sustainability_score, why_it_fits_user. Do not add any text outside the JSON.

User: Given the following user data, return 6 recommendations tailored to the Nigerian market:
- income: {income}
- goal: {goal}
- available_capital: {amount}
- risk: {risk}
- preferred_sector: {sector}

Return example object schema (use these exact field names):
[
  {
    "name": "...",
    "sector": "...",
    "description": "...",
    "expected_return_percent": 12,
    "duration_months": 12,
    "risk_level": "Low|Medium|High",
    "minimum_investment": 50000,
    "sustainability_score": 85,
    "why_it_fits_user": "..."
  }
]
```

Prompt (realism boost): after the above, append:
"When possible, reference local companies or platforms (e.g., Arnergy, ThriveAgric, Farmcrowdy). Use realistic ranges for minimum investment and expected returns for Nigerian SMEs and impact funds."

If parsing fails:

- Try to parse JSON-like substrings between the first `[` or `{` and the last `]` or `}`.
- Ask the model to re-run the prompt with stricter rules or set temperature to 0.

Notes on model settings

- Recommended: max_tokens 1200, temperature 0.3 for stability, 0.7 if you want variety.
- Prefer the latest models that support chat completions and low-latency.
