import mongoose, { Schema } from "mongoose";
import walletSchema from "../wallet/wallet.model.js";

const astrologerSchema = new Schema(
  {
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
    socketId: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    Fname: {
      type: String,
    },
    Lname: {
      type: String,
    },
    phone: {
      type: String,
      required: [true, "Phone Number is required"],
      validate: {
        validator: function (v) {
          return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v); // Regex for international or 10-digit phone number
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    specialisation: {
      type: [String],
      required: [true, "Specialisation is required"],
    },
    rating: {
      type: Number,
      default: 2,
    },
    total_number_service_provide: {
      type: Number,
      default: 0,
    },
    total_earning: {
      type: Number,
      default: 0,
    },
    wallet: {
      type: walletSchema,
      default: () => ({ balance: 0, transactionHistory: [] }),
    },
    status: {
      type: String,
      enum: ["available", "busy", "offline"],
      default: "available",
    },
    chat_price: {
      type: Number,
      required: [true, "Chat price is required"],
    },
    video_price: {
      type: Number,
      required: [true, "Video price is required"],
    },
    call_price: {
      type: Number,
      default: 200,
    },
    years_of_experience: {
      type: Number,
      required: [true, "Years of experience is required"],
    },
    profile_picture: {
      type: String,
      required: [true, "Profile picture is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    language: {
      type: [String],
      required: [true, "Language is required"],
    },
    certifications: {
      type: [String],
      required: [true, "Certifications are required"],
    },
    adhar_card: [String],
    pan_card: [String],
    promo_code: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Astrologer = mongoose.model("Astrologer", astrologerSchema);
