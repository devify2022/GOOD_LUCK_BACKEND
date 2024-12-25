import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
import { generateTransactionId } from "../../utils/generateTNX.js";

const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  transactionHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      type: { type: String, enum: ["credit", "debit"], required: true },
      amount: { type: Number, required: true },
      description: { type: String },
      reference: { type: String },
      transactionId: { type: String, required: true, default: () => generateTransactionId() },
    },
  ],
});

export const Wallet = mongoose.model("Wallet", walletSchema);
export default walletSchema;
