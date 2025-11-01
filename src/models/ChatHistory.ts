import mongoose, { Document } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  messages: IChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const ChatHistorySchema = new mongoose.Schema<IChatHistory>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    messages: [
      {
        role: { type: String, enum: ["user", "assistant"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index to optimize chat history queries by userId + timestamp
ChatHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IChatHistory>("ChatHistory", ChatHistorySchema);
