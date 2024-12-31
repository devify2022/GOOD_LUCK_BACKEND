import mongoose from "mongoose";
import { generateTransactionId } from "../../utils/generateTNX.js";

const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  transactionHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      type: { type: String, enum: ["credit", "debit"], required: true },
      debit_type: {
        type: String,
        enum: [
          "Ecom",
          "chat",
          "call",
          "video_call",
          "job_text",
          "job_banner",
          "homeLand_service",
          "withdrawl_astrologer",
          "others",
        ],
        default: null,
        required: function () {
          return this.transaction_type === "debit";
        },
      },
      credit_type: {
        type: String,
        enum: [
          "wallet_recharge",
          "chat",
          "call",
          "video_call",
          "job_text",
          "job_banner",
          "homeLand_service",
          "others",
        ],
        default: null,
        required: function () {
          return this.transaction_type === "credit";
        },
      },
      amount: { type: Number, required: true },
      description: { type: String },
      reference: { type: String },
      transactionId: {
        type: String,
        required: true,
        default: () => generateTransactionId(),
      },
    },
  ],
});

export const Wallet = mongoose.model("Wallet", walletSchema);
export default walletSchema;
