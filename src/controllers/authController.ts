import { Request, Response } from "express";
import User from "../models/User";
import generateToken from "../utils/generateToken";

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password } = req.body;
    if (!fullName || !email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ fullName, email, password });

    // Create token and set HttpOnly cookie so frontend doesn't need to store it manually.
    const token = generateToken(user._id.toString());
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      path: "/",
    });

    // return user info (token is set as cookie)
    res.status(201).json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        demoBalance: user.demoBalance,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    // set httpOnly cookie with token
    const token = generateToken(user._id.toString());
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        demoBalance: user.demoBalance,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Return current user (cookie-based auth expected)
export const me = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.id;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });
    const user = await User.findById(uid).select(
      "_id fullName email demoBalance aiPortfolio"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout: clear cookie
export const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie("token", { path: "/" });
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
