import jwt from "jsonwebtoken";
import User from "../models/User";
import { Request, Response, NextFunction } from "express";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auth = req.headers.authorization || req.cookies?.token;
    if (!auth) return res.status(401).json({ message: "No token provided" });

    const token = auth.startsWith("Bearer ") ? auth.split(" ")[1] : auth;
    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET || "dev-secret"
    );
    const user = await User.findById(decoded.id).select(
      "_id fullName email demoBalance"
    );
    if (!user) return res.status(401).json({ message: "Invalid token" });

    (req as any).user = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      demoBalance: user.demoBalance,
    };
    next();
  } catch (err) {
    console.error("authMiddleware error", err);
    res.status(401).json({ message: "Not authorized" });
  }
};

export default authMiddleware;
