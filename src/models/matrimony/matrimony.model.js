import mongoose, { Schema } from "mongoose";

const matrimonySchema = new Schema(
  {
    authId: {
      type: Schema.Types.ObjectId,
      ref: "Auth",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    photo: {
      type: String,
      required: [true, "Photo is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
    },
    salary: {
      type: String,
      required: [true, "Salary is required"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Minimum age is 18"],
    },
    subscribed: {
      type: Boolean,
      default: false,
    },
    subs_plan_name: {
      type: String,
    },
    subs_start_date: {
      type: Date,
    },
    bio: {
      type: String,
    },
    isDivorce: {
      type: Boolean,
      default: false,
    },
    pending_likes_id: {
      type: Schema.Types.ObjectId,
    },
    sent_likes_id: {
      type: Schema.Types.ObjectId,
    },
    gender: {
      type: String,
      enum: ["Male", "Female"],
    },
    cast: {
      type: String,
      enum: ["hindu", "muslim", "others"],
      required: true,
    },
    searching_for: {
      type: String,
      enum: ["bride", "groom"],
      required: true,
    },
    interests: {
      type: String,
      enum: [
        "badminton",
        "football",
        "cricket",
        "makeUp",
        "dance",
        "yoga",
        "meditation",
        "swimming",
        "movie",
        "party",
      ],
      required: true,
    },
  },
  { timestamps: true }
);

export const Matrimony = mongoose.model("Matrimony", matrimonySchema);
