import mongoose from "mongoose";
import walletSchema from "../wallet/wallet.model.js";

const { Schema } = mongoose;

const affiliateSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    authId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    Fname: {
      type: String,
      // required: [true, "First name is required"],
    },
    Lname: {
      type: String,
      // required: [true, "Last name is required"],
    },
    profile_picture: {
      type: String,
      required: [true, "Profile picture is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function (v) {
          return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    wallet: {
      type: walletSchema,
      default: () => ({ balance: 0, transactionHistory: [] }),
    },
    promo_code: {
      type: String,
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

const AffiliateMarketer = mongoose.model("AffiliateMarketer", affiliateSchema);

export default AffiliateMarketer;
