import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  transactionHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      type: { type: String, enum: ["credit", "debit"], required: true },
      amount: { type: Number, required: true },
      description: { type: String },
      reference: { type: String },
    },
  ],
});

export const Wallet = mongoose.model("Wallet", walletSchema);
export default walletSchema;
