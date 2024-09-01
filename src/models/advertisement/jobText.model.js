import mongoose, { Schema } from "mongoose";

// Define the HomeTextSchema
const jobTextSchema = new Schema(
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
    text_ad_description: {
      type: String,
      required: [true, "Text ad description is required."],
    },
    total_character: {
      type: Number,
      required: true,
      min: [1, "Total character count must be at least 1."],
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
      enum: ["Govt", "Private"],
      required: [true, "Category is required."],
    },
  },
  { timestamps: true }
);

export const JobText = mongoose.model("JobText", jobTextSchema);
