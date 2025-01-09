import { Auth } from "../../models/auth/auth.model.js";
import { User } from "../../models/auth/user.model.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import generateOtp from "../../utils/otpGenerate.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ApiError } from "../../utils/apiError.js";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../../models/auth/authRequest.model.js";
import checkRateLimit from "./../../utils/checkRateLimit.js";
import { Matrimony } from "../../models/matrimony/matrimony.model.js";
import { Dating } from "../../models/dating/dating.model.js";
import { Admin } from "../../models/admin/admin.model.js";
import { generateTransactionId } from "../../utils/generateTNX.js";
import { Astrologer } from "../../models/astrologer/astroler.model.js";
import { AdSubscription } from "../../models/subscription/adSubcription.model.js";
import AffiliateMarketer from "../../models/affiliateMarketer/affiliateMarketer.model.js";

// Helper to generate access and refresh tokens
const generateAccessAndRefreshToken = async (authId) => {
  try {
    const authUser = await Auth.findById(authId);
    if (!authUser) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = authUser.generateAccessToken();
    const refreshToken = authUser.generateRefreshToken();

    authUser.refreshToken = refreshToken;
    await authUser.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Error generating tokens");
  }
};

// Login or Register User and send OTP
const authRequest = asyncHandler(async (req, res) => {
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

  let role;
  if (!isAstrologer && !isAffiliate_marketer && !isAdmin) {
    role = "user";
  } else {
    if (isAstrologer) role = "astrologer";
    else if (isAffiliate_marketer) role = "affiliate_marketer";
    else if (isAdmin) role = "admin";
  }

  let authRecord = await Auth.findOne({ phone });
  let authRequest = await AuthRequest.findOne({ phone });
  if (!authRecord && !authRequest) {
    authRequest = new AuthRequest({
      phone,
      otp: generateOtp(),
      otpExpiresAt: Date.now() + 5 * 60 * 1000,
      Fname: Fname || "",
      Lname: Lname || "",
      gender: gender || "Others",
      date_of_birth: date_of_birth || "1900-01-01",
      isVerified: false,
      isAstrologer: role === "astrologer",
      isAffiliate_marketer: role === "affiliate_marketer",
      isAdmin: role === "admin",
      user_type: role,
    });
    await authRequest.save();
  } else {
    const newOtp = generateOtp();
    authRequest.setOtp(newOtp);
    await authRequest.save();
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { role, otp: authRequest.otp },
        "OTP sent successfully"
      )
    );
});

// Verify New User OTP
const auth_request_verify_OTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }

  const authRequestRecord = await AuthRequest.findOne({ phone });
  if (!authRequestRecord) {
    throw new ApiError(404, "User not found");
  }

  const isOtpValid = authRequestRecord.verifyOtp(otp);
  if (!isOtpValid) {
    throw new ApiError(400, "Invalid OTP");
  }

  const newAuth = new Auth({
    phone,
    otp: "",
    otpExpiresAt: "",
    isVerified: true,
    user_type: authRequestRecord.user_type,
    refreshToken: "",
  });
  await newAuth.save();

  // Create a new User record
  const newUser = new User({
    authId: newAuth._id,
    phone,
    Fname: authRequestRecord.Fname || "",
    Lname: authRequestRecord.Lname || "",
    gender: authRequestRecord.gender || "Others",
    date_of_birth: authRequestRecord.date_of_birth || "00-00-0000",
    isVerified: true,
    isAstrologer: authRequestRecord.isAstrologer,
    isAffiliate_marketer: authRequestRecord.isAffiliate_marketer,
    isAdmin: authRequestRecord.isAdmin,
    wallet: {
      transactionHistory: [
        {
          transactionId: generateTransactionId(),
          timestamp: Date.now(),
          type: "credit",
          credit_type: "others",
          amount: 0,
          description: "Initial wallet setup",
        },
      ],
    },
  });
  await newUser.save();

  // Create an Admin record if isAdmin is true
  if (authRequestRecord.isAdmin) {
    const newAdmin = new Admin({
      authId: newAuth._id,
      userId: newUser._id,
    });
    await newAdmin.save();
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    newAuth._id
  );

  await authRequestRecord.deleteOne();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        authId: newAuth._id,
        userId: newUser._id,
        role: newAuth.user_type,
        phone: newUser.phone,
        accessToken,
        refreshToken,
      },
      "OTP Verified and new user created"
    )
  );
});

// Login User
const loginUser = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  const authRecord = await Auth.findOne({ phone });
  const userRecord = await User.findOne({ phone });
  const astrologer = await Astrologer.findOne({ phone });

  if (!authRecord) {
    throw new ApiError(404, "User does not exist");
  }

  const newOtp = generateOtp();

  await Auth.findOneAndUpdate(
    { phone },
    {
      $set: {
        otp: newOtp,
        otpExpiresAt: Date.now() + 5 * 60 * 1000,
        isVerified: false,
        refreshToken: "",
      },
    },
    {
      new: true,
    }
  );
  // console.log(authRecord)

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    authRecord._id
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userId: userRecord._id,
        astrologer_id: astrologer ? astrologer._id : null,
        role: authRecord.user_type,
        accessToken,
        refreshToken,
        otp: newOtp,
      },
      "OTP sent successfully"
    )
  );
});

// Verify Existing User OTP
const login_verify_OTP = asyncHandler(async (req, res) => {
  const { phone, otp } = req.body;

  if (!phone || !otp) {
    throw new ApiError(400, "Phone number and OTP are required");
  }

  const authRecord = await Auth.findOne({ phone });
  const userRecord = await User.findOne({ phone });
  const astrologer = await Astrologer.findOne({ phone });
  if (!authRecord) {
    throw new ApiError(404, "User not found");
  }

  if (authRecord.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (authRecord.otpExpiresAt < Date.now()) {
    throw new ApiError(400, "OTP has expired");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    authRecord._id
  );

  authRecord.isVerified = true;
  authRecord.otp = "";
  authRecord.otpExpiresAt = null;
  await authRecord.save();

  // Fetch Matrimony and Dating profile IDs if they exist
  const matrimonyProfile = await Matrimony.findOne({ authId: authRecord._id });
  const datingProfile = await Dating.findOne({ authId: authRecord._id });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        userId: userRecord._id,
        astrologer: astrologer ? astrologer : null,
        role: authRecord.user_type,
        phone: authRecord.phone,
        accessToken,
        refreshToken,
        matrimonyID: matrimonyProfile ? matrimonyProfile.userId : null,
        datingID: datingProfile ? datingProfile.userId : null,
        isMatrimonySubscribed: matrimonyProfile
          ? matrimonyProfile.subscribed
          : false,
        isDatingSubscribed: datingProfile ? datingProfile.subscribed : false,
        ads_subsCription: {
          isSubscribed: userRecord.adSubscription.isSubscribed,
          StartDate: userRecord.adSubscription.startDate,
          EndDate: userRecord.adSubscription.endDate,
          isPromoApplied: userRecord.adSubscription.isPromoApplied,
          plan: userRecord.adSubscription.price,
        },
      },
      "OTP Verified"
    )
  );
});

// Refresh Access Token
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

// Resend OTP
const resendOTP = asyncHandler(async (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

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

  const newOtp = generateOtp();
  user.otp = newOtp;
  user.isVerified = false;
  await user.save();

  return res
    .status(200)
    .json(new ApiResponse(200, newOtp, "OTP Sent Successfully"));
});

// Logout User
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// Add Balance to User Wallet
const addWalletBalance = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { amount, description, transactionId } = req.body;

  // Check if the required fields are provided
  if (!userId || !amount || amount <= 0) {
    throw new ApiError(
      400,
      "User ID and amount are required and must be positive."
    );
  }

  // Find the user by their ID
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Add the balance and create the transaction history entry
  user.wallet.balance += amount;
  user.wallet.transactionHistory.push({
    transactionId,
    type: "credit",
    amount,
    description: description || "Balance added",
    reference: userId,
  });

  // Save the updated user data
  await user.save();

  // Return the updated wallet information
  return res.status(200).json({
    success: true,
    message: "Balance added successfully",
    updatedBalance: user.wallet.balance,
    transactionHistory: user.wallet.transactionHistory,
  });
});

// Get wallet balance by user ID
const getWalletBalanceByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Find the user by ID
  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  // Get the wallet balance
  const walletBalance = user.wallet.balance;

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { balance: walletBalance },
        "Wallet balance retrieved successfully"
      )
    );
});

// Buy Ad Subscription
const buyAdSubscription = asyncHandler(async (req, res) => {
  const { userId, planType, promoCode, transactionId } = req.body;

  if (!userId || !planType) {
    throw new ApiError(400, "User ID and plan type are required.");
  }

  // Now deduct the amount from the user's wallet
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  const subscriptionPlans = await AdSubscription.findOne();
  if (!subscriptionPlans) {
    throw new ApiError(404, "Ad subscription plans not found.");
  }

  // Determine the price based on the planType
  const price =
    planType === "one_month_plan"
      ? subscriptionPlans.one_month_plan
      : planType === "one_year_plan"
        ? subscriptionPlans.one_year_plan
        : null;

  if (price === null) {
    throw new ApiError(400, "Invalid plan type.");
  }

  // Initialize the discounted price (no discount is applied in this case)
  let discountedPrice = price;
  let promoUser = null;

  if (promoCode) {
    // Check if the promo code is for an affiliate marketer or astrologer
    const affiliate = await AffiliateMarketer.findOne({
      promo_code: promoCode,
    });
    const astrologer = await Astrologer.findOne({ promo_code: promoCode });

    if (affiliate) {
      promoUser = affiliate;
    } else if (astrologer) {
      promoUser = astrologer;
    }

    // If no valid promo user is found, throw an error
    if (!promoUser) {
      throw new ApiError(400, "Invalid promo code.");
    }

    // Calculate the 20% commission for the promo user and 80% for the admin
    const promoUserCommission = 0.2 * discountedPrice;
    const adminCommission = 0.8 * discountedPrice;

    // Credit 20% commission to the promo user's wallet
    promoUser.wallet.balance += promoUserCommission;
    promoUser.wallet.transactionHistory.push({
      type: "credit",
      credit_type: "advertisement",
      amount: promoUserCommission,
      description: "Commission from ad subscription",
      reference: promoCode,
      transactionId: transactionId,
    });
    await promoUser.save();

    // Credit 80% commission to the admin's wallet
    const admin = await Admin.findOne(); // Assuming a single admin
    if (admin) {
      admin.wallet.balance += adminCommission;
      admin.wallet.transactionHistory.push({
        type: "credit",
        credit_type: "advertisement",
        amount: adminCommission,
        description: "Commission from ad subscription for admin",
        reference: promoCode,
        transactionId: transactionId,
      });
      await admin.save();
    }
  }

  // if (user.wallet.balance < discountedPrice) {
  //   throw new ApiError(400, "Insufficient wallet balance.");
  // }

  // Add the amount reciept in the user's wallet
  user.wallet.transactionHistory.push({
    type: "debit",
    debit_type: "advertisement",
    amount: discountedPrice,
    description: "Ad subscription purchase",
    reference: planType,
    transactionId: transactionId,
  });

  // Credit 80% commission to the admin's wallet
  const admin = await Admin.findOne(); // Assuming a single admin
  if (admin) {
    admin.wallet.balance += price;
    admin.wallet.transactionHistory.push({
      type: "credit",
      credit_type: "advertisement",
      amount: price,
      description: "Commission from ad subscription for admin",
      reference: promoCode,
      transactionId: transactionId,
    });
    await admin.save();
  }

  // Initialize the subscription details
  user.adSubscription = {
    plan: subscriptionPlans._id,
    isSubscribed: true,
    isPromoApplied: !!promoCode,
    promo_code: promoCode || null,
    category: "advertisement",
    startDate: new Date(),
    price: discountedPrice,
    adsDetails: [],
    endDate: new Date(), // Initialize endDate here
  };

  // Set the end date based on the plan type
  if (planType === "one_month_plan") {
    user.adSubscription.endDate.setMonth(
      user.adSubscription.startDate.getMonth() + 1
    ); // Add 1 month
  } else if (planType === "one_year_plan") {
    user.adSubscription.endDate.setFullYear(
      user.adSubscription.startDate.getFullYear() + 1
    ); // Add 1 year
  }

  // Adjust the subscription end date if a promo code is applied
  if (promoCode) {
    if (planType === "one_month_plan") {
      user.adSubscription.endDate.setDate(
        user.adSubscription.endDate.getDate() + 7
      ); // Add 7 days for promo
    } else if (planType === "one_year_plan") {
      user.adSubscription.endDate.setMonth(
        user.adSubscription.endDate.getMonth() + 1
      ); // Add 1 month for promo
    }
  }

  user.superNote = 100;

  await user.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscription: user.adSubscription },
        "Ad subscription purchased successfully."
      )
    );
});

export {
  loginUser,
  login_verify_OTP,
  auth_request_verify_OTP,
  authRequest,
  logoutUser,
  refreshAccessToken,
  resendOTP,
  addWalletBalance,
  getWalletBalanceByUserId,
  buyAdSubscription,
};
