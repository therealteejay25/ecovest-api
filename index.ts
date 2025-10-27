import express from "express";
import cors from "cors";
import investRoutes from "./src/routes/invest";
// import userRoutes from "./routes/user";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/invest", investRoutes);
// app.use("/api/user", userRoutes);

app.get("/", (_, res) => res.send("Ecovest API running ✅"));

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
