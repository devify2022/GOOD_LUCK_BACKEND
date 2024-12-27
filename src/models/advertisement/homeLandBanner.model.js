import mongoose, { Schema } from "mongoose";

const homeLandBannerSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    city: {
      type: String,
      required: [true, "City is required."],
    },
    state: {
      type: String,
      required: [true, "State is required."],
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required."],
    },
    phone: {
      type: String,
      // required: [true, "Phone number is required"],
      validate: {
        validator: function (v) {
          return /^(\+\d{1,3}[- ]?)?\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    banner_url: {
      type: String,
      required: [true, "Banner URL is required."],
      match: [
        /^(http|https):\/\/[^ "]+$/,
        "Please enter a valid URL for the banner.",
      ],
    },
    is_subscribed: {
      type: Boolean,
      default: false,
    },
    subs_plan: {
      type: String,
      default: null,
    },
    subs_start_date: {
      type: Date,
      default: null,
    },
    subs_end_date: {
      type: Date,
      default: null,
    },
    transaction_id: {
      type: String,
      default: null,
    },
    is_promoCode_applied: {
      type: Boolean,
      default: false,
    },
    promocode: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      enum: ["Home", "Land"],
      required: [true, "Category is required."],
    },
  },
  { timestamps: true }
);

export const HomeLandBanner = mongoose.model("HomeLandBanner", homeLandBannerSchema);
