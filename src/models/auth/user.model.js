import mongoose, { Schema } from "mongoose";
import walletSchema from "../wallet/wallet.model.js";

const usersSchema = new Schema(
  {
    authId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    socketId: {
      type: String,
      default: null,
    },
    Fname: {
      type: String,
    },
    Lname: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
    },
    date_of_birth: {
      type: String,
    },
    profile_picture: {
      type: String,
      default: "https://i.fbcd.co/products/resized/resized-750-500/d4c961732ba6ec52c0bbde63c9cb9e5dd6593826ee788080599f68920224e27d.jpg",
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
    },
    last_login: {
      type: String,
    },
    services: [String],
    wallet: {
      type: walletSchema, // Use the wallet schema here
      default: () => ({ balance: 0, transactionHistory: [] }), // Default structure for the wallet
    },
    adSubscription: {
      plan: {
        type: Schema.Types.ObjectId,
        ref: "AdSubscription",
      },
      isSubscribed: {
        type: Boolean,
        default: false,
      },
      isPromoApplied: {
        type: Boolean,
        default: false,
      },
      promo_code: {
        type: Number,
      },
      category: {
        type: String,
        default: "advertisement",
      },
      startDate: {
        type: Date,
      },
      endDate: {
        type: Date,
      },
      price: {
        type: Number,
      },
      adsDetails: [
        {
          adType: {
            type: String,
            enum: ["HomeLandText", "HomeLandBanner", "JobText", "JobBanner"],
          },
          adId: {
            type: Schema.Types.ObjectId,
          },
          details: {
            type: Object,
            _id: false,
          },
        },
      ],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    isAstrologer: {
      type: Boolean,
      default: false,
    },
    isAffiliate_marketer: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    superNote: {
      type: Number,
      default: 2000,
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", usersSchema);
