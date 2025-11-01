# Frontend Integration Guide — Ecovest MVP

This document explains how frontend developers should interact with the Ecovest MVP backend (cookie-based auth). It includes endpoints, expected request/response shapes, and recommended UX behaviors.

Base URL

- Local: http://localhost:4000 (or `PORT` from env)

Authentication

- Upon successful registration or login the server sets an HttpOnly cookie named `token` containing a JWT. This cookie is not accessible to JavaScript (httpOnly) for safer storage.
- For API requests from the browser, include credentials so the cookie is sent automatically.
  - If using fetch: set `credentials: 'include'`.
  - If using axios: set `withCredentials: true`.

Login/Register flow

- Register: POST /auth/register

  - Body: { fullName, email, password }
  - Response: { user: { id, fullName, email, demoBalance } }
  - Cookie: `token` (HttpOnly) set by server.

- Login: POST /auth/login
  - Body: { email, password }
  - Response: { user: { id, fullName, email, demoBalance } }
  - Cookie: `token` (HttpOnly) set by server.

Protected routes

- The dashboard route is protected. Example request to get dashboard data:

  fetch(`/dashboard/${userId}`, {
  method: 'GET',
  credentials: 'include', // IMPORTANT: sends the HttpOnly cookie
  headers: { 'Content-Type': 'application/json' }
  })

  The server will verify the JWT from the cookie and respond with dashboard data.

API Endpoints (summary)

- POST /auth/register — create a new user. Returns user info and sets cookie.
- POST /auth/login — login existing user. Returns user info and sets cookie.
- POST /auth/google — sign in with Google (body: { idToken }). Returns user and sets cookie.
- POST /auth/unlink-google — (protected) unlink Google from your account.
- GET /dashboard/:userId — (protected) returns dashboard payload:

  - { fullName, demoBalance, portfolioValue, invested, predictedGrowth, sustainabilityScore, investments }

- GET /auth/me — (protected) returns current authenticated user (from cookie)
- POST /auth/logout — (protected) clears the server cookie and logs the user out

AI endpoints

- POST /api/ai/generate — (protected) generates AI investment recommendations for the user and stores them in the user's `aiPortfolio`.
  - Body: optional { userId } (if omitted, uses the authenticated user)
  - Response: { aiPortfolio: [ ...recommendations ] }

Investing endpoints

- POST /api/invest — create an investment from an AI recommendation. Body: { recommendationIndex?, recommendation?, amount }
- POST /api/invest/simulate — simulate a projection for UI. Body: { recommendation, amount } returns monthly projection.
- POST /api/invest/add — top-up an existing investment. Body: { investmentId, amount }
- POST /api/invest/drop — drop/sell entire investment (credits demoBalance with currentValue). Body: { investmentId }
- POST /api/invest/sell — partial or full sell. Body: { investmentId, amount? , percent? } (percent 0-100)
- POST /api/invest/admin/toggle-fluctuate — (protected) toggle volatility shocks for a given investment. Body: { investmentId, fluctuate }

AI & Investing (notes)

- Demo balances are automatically credited with positive gains from active investments on each simulation tick. This means the user's `demoBalance` will grow as investments accrue gains — small gains are automatically added to the demo balance without selling.
- The percentage of gains credited per tick can be controlled via the `PAYOUT_FRACTION` env var (default 1 = 100%). Example in `.env`: `PAYOUT_FRACTION=0.5` will credit 50% of gains.

Client-side UX recommendations

- After login/register, the frontend should store user info from response in memory (or a secure client store). Do not attempt to read the JWT token — it's HttpOnly and not accessible.
- For auto-login or session check, call a protected endpoint (e.g., /auth/me or /dashboard/:userId) with credentials included; if the cookie is valid, it will return user info.
- When logging out, call POST /auth/logout; the server will clear the cookie.

Google Sign-In (frontend)

- Use Google Identity Services to obtain an `id_token` on the client. Example (pseudo):

  const idToken = await googleClient.getToken();
  const res = await fetch('/auth/google', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ idToken })
  });

- After successful sign-in the server sets an HttpOnly `token` cookie. To unlink, call POST /auth/unlink-google (protected).

Calling protected endpoints from SPA

- Use `credentials: 'include'` in fetch or `withCredentials: true` in axios so the HttpOnly cookie is sent.

Example: simulate -> invest -> top-up -> sell (PowerShell)

```powershell
# simulate
curl -X POST http://localhost:4000/api/invest/simulate -H "Content-Type: application/json" -d '{ "recommendation": { "expected_return_percent": 12, "duration": 12, "risk_level":"Medium" }, "amount": 50000 }' -i -b cookies.txt

# invest
curl -X POST http://localhost:4000/api/invest -H "Content-Type: application/json" -d '{ "recommendationIndex": 0, "amount": 50000 }' -i -b cookies.txt

# top-up
curl -X POST http://localhost:4000/api/invest/add -H "Content-Type: application/json" -d '{ "investmentId": "<INV_ID>", "amount": 10000 }' -i -b cookies.txt

# partial sell (sell 50%)
curl -X POST http://localhost:4000/api/invest/sell -H "Content-Type: application/json" -d '{ "investmentId": "<INV_ID>", "percent": 50 }' -i -b cookies.txt
```

Security notes

- Use HTTPS in production so cookies marked `secure` are transmitted safely.
- If you prefer token-in-memory approach instead of cookies, update backend to return token and remove HttpOnly cookie; however, cookies are recommended for this demo to simplify CSRF protections when combined with SameSite.

If you want, I can add a Postman collection or example React hooks for these flows — tell me which and I'll add them.
