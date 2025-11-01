import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cron from "node-cron";

import authRoutes from "./src/routes/auth";
import dashboardRoutes from "./src/routes/dashboard";
import aiRoutes from "./src/routes/ai";
import investRoutes from "./src/routes/invest";
import { updateAllInvestments } from "./src/utils/updateInvestments";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: [
      "https://ecovest01.vercel.app", // your production frontend
      "http://localhost:3000",        // your local dev frontend
    ],
    credentials: true, // allow cookies & auth headers
  })
);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/invest", investRoutes);

app.get("/", (_, res) => res.send("Ecovest MVP skeleton running"));

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

app.listen(PORT, () =>
  console.log(`[server] listening on http://localhost:${PORT}`)
);

export default app;
