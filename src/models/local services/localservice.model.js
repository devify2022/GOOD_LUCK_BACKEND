import mongoose, { Schema } from "mongoose";

const LocalServiceSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  authId: {
    type: Schema.Types.ObjectId,
    ref: "Auth",
    required: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: "LocalServiceCategory",
    required: [true, "Service category is required"],
  },
  image: {
    type: String,
    required: [true, "Service banner is required"],
    trim: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  contact: {
    type: String,
    required: [true, "Contact number is required"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const LocalService = mongoose.model("LocalService", LocalServiceSchema);
