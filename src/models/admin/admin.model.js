import mongoose, { Schema } from "mongoose";

const adminSchema = new Schema(
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
    created_by: {
      type: Schema.Types.ObjectId, // Admin who created this admin (if applicable)
      ref: "Admin",
    },
  },
  { timestamps: true }
);

export const Admin = mongoose.model("Admin", adminSchema);
