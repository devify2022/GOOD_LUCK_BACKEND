import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import generateOtp from "../utils/otpGenerate.js";
import checkRateLimit from "../utils/checkRateLimit.js";
import { User } from "../models/user.model.js";
import { Auth } from "../models/auth.model.js";

const generateAccessAndRefreshToken = async (authId) => {
  try {
    // Find the user in the Auth schema by their authId
    const authUser = await Auth.findById(authId);
    if (!authUser) {
      throw new Error("User not found");
    }

    // Generate access and refresh tokens using the methods from authSchema
    const accessToken = authUser.generateAccessToken(); // Method from authSchema
    const refreshToken = authUser.generateRefreshToken(); // Method from authSchema

    // Save the new refresh token in the Auth schema
    authUser.refreshToken = refreshToken;
    await authUser.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError("500", "Something went wrong while generating tokens");
  }
};

const loginUser = asyncHandler(async (req, res) => {
  const {
    phone,
    Fname,
    Lname,
    gender,
    date_of_birth,
    isAstrologer,
    isAffiliate_marketer,
    isAdmin,
  } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  // Determine user role based on the request body
  let role = "user"; // Default role
  if (isAstrologer) {
    role = "astrologer";
  } else if (isAffiliate_marketer) {
    role = "affiliate_marketer";
  } else if (isAdmin) {
    role = "admin";
  }

  // Find or create the auth record
  let authRecord = await Auth.findOne({ phone });

  if (!authRecord) {
    // Create a new Auth record if none exists
    authRecord = new Auth({
      phone,
      otp: generateOtp(), // Generate OTP here
      otpExpiresAt: Date.now() + 5 * 60 * 1000, // OTP valid for 5 minutes
      isVerified: false,
      user_type: role,
      refreshToken: "", // Initialize empty or handle accordingly
    });
    await authRecord.save();
  } else {
    // If auth record exists, generate a new OTP
    const newOtp = generateOtp();
    authRecord.setOtp(newOtp); // Update OTP and expiration
    await authRecord.save();
  }

  // Find or create the user record
  let user = await User.findOne({ phone });

  if (!user) {
    // If no user exists, create a new one
    user = new User({
      userId: authRecord._id,
      phone,
      Fname: Fname || "", // Provide default values if not present
      Lname: Lname || "", // Provide default values if not present
      gender: gender || "Others", // Provide default value for gender
      date_of_birth: date_of_birth || "1900-01-01", // Default DOB if not provided
      isVerified: false,
      isAstrologer: role === "astrologer",
      isAffiliate_marketer: role === "affiliate_marketer",
      isAdmin: role === "admin",
    });
    await user.save();
  }

  // Generate tokens using the generateAccessAndRefreshToken function
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    authRecord._id
  );

  // Prepare response data
  const data = {
    role,
    accessToken,
    refreshToken,
    otp: authRecord.otp,
    message: "OTP sent successfully",
  };

  // Send response
  return res.status(200).json(data);
});

const verify_OTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }

  // Find the auth record by phone number
  const authRecord = await Auth.findOne({ phone });

  if (!authRecord) {
    throw new ApiError(404, "User not found");
  }

  // Verify the OTP
  const isOtpValid = authRecord.verifyOtp(otp);

  if (!isOtpValid) {
    throw new ApiError(400, "Invalid OTP");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    authRecord._id
  );

  // Check if user already exists
  let user = await User.findOne({ phone });

  if (!user) {
    // Create a new User record
    user = new User({
      phone,
      otp: authRecord.otp, // You might want to set this to null or adjust
      isVerified: true,
      isAstrologer: authRecord.user_type === "astrologer",
      isAffiliate_marketer: authRecord.user_type === "affiliate_marketer",
      isAdmin: authRecord.user_type === "admin",
    });
    await user.save();
  }

  // Mark the auth record as verified
  authRecord.isVerified = true;
  await authRecord.save();

  const data = {
    role: authRecord.user_type,
    phone: user.phone,
    accessToken,
    refreshToken,
    isNewUser: !user.isVerified,
    userDetails: user,
  };

  return res.status(200).json(new ApiResponse(200, data, "OTP Verified"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken: incomingRefreshToken } = req.body;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);

    if (!user || incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "New tokens generated"
        )
      );
  } catch (error) {
    throw new ApiError(401, "Invalid refresh token");
  }
});

const resendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  // Check rate limit for resending OTP
  const { allowed, remainingTime } = checkRateLimit(phone);
  if (!allowed) {
    throw new ApiError(
      429,
      `Too many requests. Try again in ${Math.ceil(remainingTime / 60000)} minutes.`
    );
  }

  let user = await User.findOne({ phone });
  if (!user) {
    throw new ApiError(400, "Invalid phone number");
  }

  // Generate a new OTP and update the user record
  const newOtp = generateOtp();
  user.otp = newOtp;
  user.isVerified = false;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, newOtp, "OTP Sent Successfully"));
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  // Clear access and refresh tokens from cookies
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

export { loginUser, verify_OTP, logoutUser, refreshAccessToken, resendOTP };
