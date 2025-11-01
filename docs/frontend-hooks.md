# Frontend Example Hooks

This folder contains small React hooks examples that show how to integrate with the Ecovest backend using cookie-based auth (HttpOnly `token` cookie).

Files:

- `src/frontend-examples/useAuth.tsx` — login/register/logout and session fetch (`/auth/*`).
- `src/frontend-examples/useChat.tsx` — load chat history, send messages, clear history (`/api/chat/*`).
- `src/frontend-examples/useInvest.tsx` — simulate, invest, top-up, sell/drop (`/api/invest/*`).

Usage notes

- These are example hooks intended for frontend developers. They assume the frontend runs on `http://localhost:3000` and the backend on `http://localhost:4000` with CORS configured to accept credentials.
- All requests set `credentials: 'include'` so the HttpOnly cookie is sent automatically.
- Adjust error handling and typings to match your app's conventions.

Try it in a React app

1. Copy the `src/frontend-examples` files into your frontend project.
2. Install React and relevant types (if using TypeScript):

```powershell
pnpm add react react-dom
pnpm add -D @types/react @types/react-dom
```

3. Use the hooks in components, for example:

```tsx
import React from "react";
import { useAuth } from "./useAuth";

function App() {
  const { user, login, logout } = useAuth();
  // ...
}
```
