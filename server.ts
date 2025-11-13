import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "path";
import cron from "node-cron";

import authRoutes from "./src/routes/auth";
import dashboardRoutes from "./src/routes/dashboard";
import aiRoutes from "./src/routes/ai";
import investRoutes from "./src/routes/invest";
import chatRoutes from "./src/routes/chat";
import onboardingRoutes from "./src/routes/onboarding";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import { updateAllInvestments } from "./src/utils/updateInvestments";
import fetch from "node-fetch";

dotenv.config();

const app = express();
// Production / frontend settings
const isProd = process.env.NODE_ENV === "production";
const allowedOrigins = [
  "http://localhost:3000",
  "https://ecovest01.vercel.app"
];

app.use(cors({
  origin: (origin: any, callback: any) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

// Force HTTPS in production (uses x-forwarded-proto header set by Render)
if (isProd) {
  app.use((req, res, next) => {
    const proto = (req.headers["x-forwarded-proto"] || "").toString();
    if (proto && proto !== "https") {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}
app.use(express.json());
app.use(cookieParser());

// Serve documentation folder at /docs
app.use(
  "/docs",
  express.static(path.join(process.cwd(), "docs"), { index: false })
);
app.get("/docs", (_, res) =>
  res.sendFile(path.join(process.cwd(), "docs", "index.html"))
);

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/invest", investRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/onboarding", onboardingRoutes);

app.get("/", (_, res) => res.send("Ecovest MVP skeleton running"));

// Keep-alive endpoint for Render
app.get("/ping", (_, res) => {
  console.log("[server] Ping received at", new Date().toISOString());
  res.send("pong");
});

// Swagger UI (OpenAPI) for frontend devs — serves the docs/openapi.json
try {
  const openApiPath = path.join(process.cwd(), "docs", "openapi.json");
  if (fs.existsSync(openApiPath)) {
    const openApiDoc = JSON.parse(fs.readFileSync(openApiPath, "utf8"));
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));
    console.log("[server] Swagger UI available at /api-docs");
  }
} catch (err) {
  console.warn("[server] failed to mount Swagger UI:", err);
}

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/ecovest-demo";
const PORT = Number(process.env.PORT || 4000);

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("[server] MongoDB connected"))
  .catch((err) => {
    console.error("[server] MongoDB connection error:", err);
    process.exit(1);
  });

// Start background updater: runs every minute by default. Adjust via env SIMULATION_CRON.
const CRON_SCHEDULE = process.env.SIMULATION_CRON || "*/1 * * * *"; // every minute
cron.schedule(CRON_SCHEDULE, async () => {
  console.log(
    "[server] running scheduled investment updater",
    new Date().toISOString()
  );
  try {
    await updateAllInvestments();
  } catch (err) {
    console.error("[server] updater error", err);
  }
});

// Self-ping mechanism to prevent Render from spinning down
const RENDER_URL = process.env.RENDER_URL || undefined; // set in env when deployed
if (RENDER_URL) {
  setInterval(async () => {
    try {
      const response = await fetch(`${RENDER_URL}/ping`);
      console.log("[server] Self-ping succeeded:", new Date().toISOString());
    } catch (err) {
      console.error("[server] Self-ping failed:", err);
    }
  }, 840000); // 14 minutes in milliseconds
  console.log("[server] Self-ping mechanism enabled");
}

app.listen(PORT, () =>
  console.log(`[server] listening on http://localhost:${PORT}`)
);

export default app;
