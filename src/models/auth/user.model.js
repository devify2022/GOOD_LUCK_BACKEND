import mongoose, { Schema } from "mongoose";

const usersSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
    },
    Fname: {
      type: String,
      required: [true, "First name is required"],
    },
    Lname: {
      type: String,
      required: [true, "Last name is required"],
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
      required: [true, "Gender is required"],
    },
    date_of_birth: {
      type: String,
      required: [true, "DOB is required"],
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
    last_login: {
      type: String,
      validate: {
        validator: function (v) {
          return /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(v); // ISO 8601 date format
        },
        message: (props) => `${props.value} is not a valid date format!`,
      },
    },
    services: [String],
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
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", usersSchema);
