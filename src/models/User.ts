import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  fullName: string;
  email: string;
  password: string;
  demoBalance: number;
  aiPortfolio: any[];
  actualInvestments: mongoose.Types.ObjectId[];
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
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (this: any, next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);
