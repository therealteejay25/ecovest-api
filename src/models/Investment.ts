import mongoose from "mongoose";

const InvestmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    sector: { type: String, default: "General" },
    initialAmount: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    expectedReturn: { type: Number, default: 0 }, // percent over whole duration
    durationMonths: { type: Number, default: 6 },
    riskLevel: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    startDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ["active", "completed", "recommended"],
      default: "recommended",
    },
    sustainabilityScore: { type: Number, default: 80 },
    // Whether this investment occasionally experiences larger random fluctuations (shock events)
    fluctuate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Investment", InvestmentSchema);
