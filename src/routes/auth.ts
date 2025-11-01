import express from "express";
import {
  register,
  login,
  me,
  logout,
  googleAuth,
  unlinkGoogle,
} from "../controllers/authController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/unlink-google", authMiddleware, unlinkGoogle);

// returns current authenticated user (reads token from cookie or Authorization header)
router.get("/me", authMiddleware, me);

// logout (clears cookie)
router.post("/logout", authMiddleware, logout);

export default router;
