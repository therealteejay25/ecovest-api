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
  - GET /dashboard/:userId — (protected) returns dashboard payload:

    - { fullName, demoBalance, portfolioValue, invested, predictedGrowth, sustainabilityScore, investments }

  - GET /auth/me — (protected) returns current authenticated user (from cookie)
  - POST /auth/logout — (protected) clears the server cookie and logs the user out

  AI endpoints

  - POST /api/ai/generate — (protected) generates AI investment recommendations for the user and stores them in the user's `aiPortfolio`.
    - Body: optional { userId } (if omitted, uses the authenticated user)
    - Response: { aiPortfolio: [ ...recommendations ] }

  AI & Investing (future/extension)

  - The backend exposes endpoints to request AI recommendations and to invest. These endpoints use the same cookie-based auth. When invoking AI generation from the frontend, call the AI generate route (if available) with credentials included.

  Client-side UX recommendations

  - After login/register, the frontend should store user info from response in memory (or a secure client store). Do not attempt to read the JWT token — it's HttpOnly and not accessible.
  - For auto-login or session check, call a protected endpoint (e.g., /dashboard/:userId or a dedicated /me endpoint) with credentials included; if the cookie is valid, it will return user info.
  - When logging out (not implemented in the skeleton), clear the cookie server-side (set cookie with empty value and immediate expiry). Implement a POST /auth/logout that clears the cookie.

  Implementation notes for frontend devs

  - To call the AI generation endpoint from the browser, use credentials so the auth cookie is sent:

    fetch('/api/ai/generate', { method: 'POST', credentials: 'include' })

    The server will reply with the generated recommendations and save them on the user record.

  Example minimal login (fetch)

  ```js
  const res = await fetch("/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  // data.user contains id, fullName, demoBalance
  ```

  Security notes

  - Use HTTPS in production so cookies marked `secure` are transmitted safely.
  - If you prefer token-in-memory approach instead of cookies, update backend to return token and remove HttpOnly cookie; however, cookies are recommended for this demo to simplify CSRF protections when combined with SameSite.

  If you want, I can add a small `/auth/logout` endpoint and an endpoint `/auth/me` that returns the current user from the cookie — tell me which you'd prefer and I'll add them.
