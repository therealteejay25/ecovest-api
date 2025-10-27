import { Router } from "express";
import { getInvestmentAdvice } from "../controllers/invest";

const router = Router();

router.post("/", getInvestmentAdvice);

export default router;