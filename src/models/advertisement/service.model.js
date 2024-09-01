import mongoose, { Schema } from "mongoose";

// Define your serviceAdSchema
const serviceAdSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    homeAdType: {
      type: String,
      enum: ["HomeText", "HomeBanner"],
      required: true,
    },
    home_ads: {
      type: Schema.Types.ObjectId,
      refPath: "homeAdType",
    },
    jobAdType: {
      type: String,
      enum: ["JobText", "JobBanner"],
      required: true,
    },
    job_ads: {
      type: Schema.Types.ObjectId,
      refPath: "JobText",
    },
    generale_ads: {
      type: Schema.Types.ObjectId,
      ref: "GeneralAd",
    },
  },
  { timestamps: true }
);

export const ServiceAds = mongoose.model("ServiceAds", serviceAdSchema);
