import mongoose, { Schema } from "mongoose";

const datingSchema = new Schema(
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
    Fname: {
      type: String,
      required: [true, "First name is required"],
    },
    Lname: {
      type: String,
      required: [true, "Last name is required"],
    },
    age: {
      type: Number,
      required: [true, "Age is required"],
      min: [18, "Minimum age is 18"],
    },
    photos: {
      type: [String],
      required: [true, "Photo is required"],
    },
    subscribed: {
      type: Boolean,
      default: false,
    },
    city: {
      type: String,
      required: [true, "City is required"],
    },
    state: {
      type: String,
      required: [true, "State is required"],
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
    smoker: {
      type: Boolean,
      default: false,
    },
    alcoholic: {
      type: Boolean,
      default: false,
    },
    sent_likes_id: {
      type: [Schema.Types.ObjectId],
      ref: "Matrimony",
      default: [],
    },
    pending_likes_id: {
      type: [Schema.Types.ObjectId],
      ref: "Matrimony",
      default: [],
    },
    education: {
      type: String,
      enum: [
        "bachelors",
        "in college",
        "high school",
        "phd",
        "in Grad school",
        "masters",
        "trade school",
      ],
      required: true,
    },
    orientation: {
      type: String,
      enum: ["straight", "gay", "lesbian"],
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
    looking_for: {
      type: String,
      enum: ["male", "female", "both"],
      required: true,
    },
  },
  { timestamps: true }
);

export const Dating = mongoose.model("Dating", datingSchema);
