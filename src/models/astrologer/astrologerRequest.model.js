import mongoose from "mongoose";

const { Schema } = mongoose;

const astrologerRequestSchema = new Schema(
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
    isApproved: {
      type: Boolean,
      default: false,
    },
    request_status: {
      type: String,
      enum: ["approved", "rejected", "pending"],
      default: "pending",
    },
    request_status_message: {
      type: String,
      default: "",
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
  },
  { timestamps: true }
);

const AstrologerRequest = mongoose.model(
  "AstrologerRequest",
  astrologerRequestSchema
);

export default AstrologerRequest;
