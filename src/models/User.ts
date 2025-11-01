import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export type InvestmentGoal = "sdg" | "profit" | "both";
export type RiskTolerance = "low" | "medium" | "high";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  demoBalance: number;
  aiPortfolio: any[];
  actualInvestments: mongoose.Types.ObjectId[];
  googleId?: string;
  authProvider?: string;
  profileImage?: string;
  isVerified?: boolean;
  // Onboarding fields
  investmentGoal?: InvestmentGoal;
  riskTolerance?: RiskTolerance;
  monthlyIncome?: number;
  onboardingCompleted?: boolean;
  matchPassword(entered: string): Promise<boolean>;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    demoBalance: { type: Number, default: 300000 }, // ₦300,000 demo balance on signup
    aiPortfolio: { type: Array, default: [] },
    actualInvestments: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Investment" },
    ],
    // Google / OAuth fields
    googleId: { type: String, index: true, sparse: true },
    authProvider: { type: String, enum: ["email", "google"], default: "email" },
    profileImage: { type: String },
    isVerified: { type: Boolean, default: false },
    // Onboarding fields
    investmentGoal: {
      type: String,
      enum: ["sdg", "profit", "both"],
      default: undefined,
    },
    riskTolerance: {
      type: String,
      enum: ["low", "medium", "high"],
      default: undefined,
    },
    monthlyIncome: {
      type: Number,
      default: undefined,
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (this: any, next) {
  // Only hash when password is set or modified
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
