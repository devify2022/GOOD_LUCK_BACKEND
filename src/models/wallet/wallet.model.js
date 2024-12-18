import mongoose from "mongoose";

const { Schema, model } = mongoose;

const walletSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      refPath: "ownerModel",
      required: true,
    },
    ownerModel: {
      type: String,
      enum: ["User", "Astrologer", "Admin"],
      required: true,
    },
    balance: { type: Number, default: 0 },
    transactionHistory: [
      {
        type: { type: String, enum: ["credit", "debit"], required: true },
        amount: { type: Number, required: true },
        description: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const Wallet = mongoose.model("Wallet", walletSchema);
