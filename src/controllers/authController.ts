import { Request, Response } from "express";
import User from "../models/User";
import generateToken from "../utils/generateToken";
import axios from "axios";
import crypto from "crypto";

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

// Google Sign-In (expects idToken from client)
export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Missing idToken" });

    // Verify token with Google's tokeninfo endpoint
    const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(
      idToken
    )}`;
    const resp = await axios.get(verifyUrl).catch((err) => {
      console.error(
        "Google token verification error",
        err?.response?.data || err.message
      );
      return null;
    });

    if (!resp || resp.status !== 200)
      return res.status(401).json({ message: "Invalid Google token" });

    const payload = resp.data as any; // contains sub (google id), email, name, picture, aud, etc.
    const googleId = payload.sub;
    const email = payload.email;
    const fullName = payload.name || payload.given_name || "Google User";
    const picture = payload.picture || "";

    if (!googleId || !email)
      return res.status(400).json({ message: "Invalid Google token payload" });

    // If GOOGLE_CLIENT_ID is set, verify audience matches
    const expectedAud = process.env.GOOGLE_CLIENT_ID;
    if (expectedAud) {
      if (payload.aud !== expectedAud) {
        console.warn("Google token aud mismatch", {
          expected: expectedAud,
          got: payload.aud,
        });
        return res
          .status(401)
          .json({ message: "Google token audience mismatch" });
      }
    }

    // Find existing user by googleId or by email
    let user = (await User.findOne({ googleId })) as any;
    if (!user) {
      user = (await User.findOne({ email })) as any;
      if (user) {
        // attach googleId to existing account
        user.googleId = googleId;
        user.authProvider = "google";
        await user.save();
      }
    }

    if (!user) {
      // create new user with a random password (will be hashed by pre-save)
      const randomPassword = crypto.randomBytes(16).toString("hex");
      user = await User.create({
        fullName,
        email,
        password: randomPassword,
        googleId,
        authProvider: "google",
        profileImage: picture,
        isVerified: true,
      });
    }

    // set httpOnly cookie
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
    console.error("googleAuth error", err);
    res.status(500).json({ message: "Google auth failed" });
  }
};

// Unlink Google from an existing account (protected)
export const unlinkGoogle = async (req: Request, res: Response) => {
  try {
    const uid = (req as any).user?.id;
    if (!uid) return res.status(401).json({ message: "Not authenticated" });

    const user = await User.findById(uid);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.googleId = undefined;
    user.authProvider = "email";
    await user.save();

    res.json({ message: "Unlinked Google account" });
  } catch (err) {
    console.error("unlinkGoogle error", err);
    res.status(500).json({ message: "Failed to unlink" });
  }
};
