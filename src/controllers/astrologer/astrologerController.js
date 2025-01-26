import { v4 as uuidv4 } from "uuid";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { UpdateAstrologerProfile } from "../../models/astrologer/updateAstrologer.model.js";
import generateOtp from "../../utils/otpGenerate.js";
import { User } from "../../models/auth/user.model.js";
import { Astrologer } from "../../models/astrologer/astroler.model.js";
import { Auth } from "../../models/auth/auth.model.js";
import AstrologerRequest from "../../models/astrologer/astrologerRequest.model.js";
import { generateTransactionId } from "../../utils/generateTNX.js";

// Function to generate a unique 4-digit promo code
const generateUniquePromoCode = async () => {
  let promoCode;
  let isUnique = false;

  while (!isUnique) {
    promoCode = Math.floor(1000 + Math.random() * 9000); // Generate a 4-digit number
    const existingAstrologer = await Astrologer.findOne({
      promo_code: promoCode,
    });
    if (!existingAstrologer) {
      isUnique = true;
    }
  }

  return promoCode;
};

// Create Astrologer Request
export const createAstrologerRequest = asyncHandler(async (req, res) => {
  try {
    const {
      Fname,
      Lname,
      phone,
      specialisation,
      chat_price,
      video_price,
      call_price,
      years_of_experience,
      profile_picture,
      description,
      language,
      certifications,
      adhar_card,
      pan_card,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      "Fname",
      "Lname",
      "phone",
      "specialisation",
      "chat_price",
      "video_price",
      "years_of_experience",
      "profile_picture",
      "description",
      "language",
      "certifications",
      "adhar_card",
      "pan_card",
    ];

    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json(
        new ApiResponse(400, null, "Missing required fields", {
          missingFields,
        })
      );
    }

    const existsAuth = await Auth.findOne({ phone });
    const existsUser = await User.findOne({ phone });
    const existsAstrologer = await Astrologer.findOne({ phone });

    if (existsUser) {
      if (existsUser.isAstrologer) {
        if (!existsAstrologer) {
          const astrologer = new AstrologerRequest({
            authId: existsAuth ? existsAuth._id : null,
            userId: existsUser._id,
            Fname: Fname,
            Lname: Lname,
            phone: existsUser.phone,
            specialisation,
            rating: 2,
            total_number_service_provide: 0,
            total_earning: 0,
            chat_price,
            video_price,
            call_price: call_price || 200,
            years_of_experience,
            profile_picture,
            description,
            language,
            certifications,
            adhar_card,
            pan_card,
          });

          await astrologer.save();

          return res
            .status(201)
            .json(
              new ApiResponse(
                201,
                astrologer,
                "Astrologer created successfully"
              )
            );
        } else {
          return res
            .status(400)
            .json(new ApiResponse(400, null, "User is already an astrologer"));
        }
      } else {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              null,
              "Phone number is already used by a normal user"
            )
          );
      }
    } else {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }
  } catch (error) {
    // Handle unexpected errors
    if (error.name === "ValidationError") {
      // Mongoose validation error
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Validation error", error.errors));
    }
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Internal Server Error", error.message));
  }
});

// Get all pending astrologer requests
export const getAllPendingRequests = asyncHandler(async (req, res) => {
  const pendingRequests = await AstrologerRequest.find({
    request_status: "pending",
  });
  if (pendingRequests.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No pending astrologers"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        pendingRequests,
        "All pending astrologer requests retrieved successfully"
      )
    );
});

// Get pending astrologer request by ID
export const getPendingRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const pendingRequest = await AstrologerRequest.findOne({
    _id: id,
    request_status: "pending",
  });
  if (!pendingRequest) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Pending astrologer request not found"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        pendingRequest,
        "Pending astrologer request retrieved successfully"
      )
    );
});

// Get all rejected astrologer requests
export const getAllRejectedRequests = asyncHandler(async (req, res) => {
  const rejectedRequests = await AstrologerRequest.find({
    request_status: "rejected",
  });

  if (rejectedRequests.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No rejected astrologers"));
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        rejectedRequests,
        "All rejected astrologer requests retrieved successfully"
      )
    );
});

// Get rejected astrologer request by ID
export const getRejectedRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const rejectedRequest = await AstrologerRequest.findOne({
    _id: id,
    request_status: "rejected",
  });
  if (!rejectedRequest) {
    return res
      .status(404)
      .json(
        new ApiResponse(404, null, "Rejected astrologer request not found")
      );
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        rejectedRequest,
        "Rejected astrologer request retrieved successfully"
      )
    );
});

// Get all astrologers
export const getAllAstrologers = asyncHandler(async (req, res) => {
  try {
    const astrologers = await Astrologer.find();

    if (astrologers.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No astrologers found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          astrologers,
          "All astrologers retrieved successfully"
        )
      );
  } catch (error) {
    throw error;
  }
});

// Get Astrologer by ID
export const getAstrologerById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Astrologer ID is required");
    }

    const astrologer = await Astrologer.findById(id);

    if (!astrologer) {
      throw new ApiError(404, "Astrologer not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, astrologer, "Astrologer retrieved successfully")
      );
  } catch (error) {
    // Let the errorHandler middleware handle the error
    throw error;
  }
});

export const updateRequestAstrologerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    Fname,
    Lname,
    phone,
    specialisation,
    chat_price,
    video_price,
    call_price,
    years_of_experience,
    profile_picture,
    description,
    language,
    certifications,
  } = req.body;

  if (!phone) {
    throw new ApiError(400, "Phone number is required");
  }

  const astrologer = await Astrologer.findOne({ authId: id });
  if (!astrologer) {
    throw new ApiError(404, "Astrologer not found");
  }

  let updateRequest = await UpdateAstrologerProfile.findOne({ phone });

  if (astrologer) {
    if (!updateRequest) {
      updateRequest = new UpdateAstrologerProfile({
        Fname,
        Lname,
        phone,
        specialisation,
        chat_price,
        video_price,
        call_price,
        years_of_experience,
        profile_picture,
        description,
        language,
        certifications,
        otp: generateOtp(),
      });
      await updateRequest.save();
    } else {
      const newOtp = generateOtp();
      updateRequest.setOtp(newOtp);
      await updateRequest.save();
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { otp: updateRequest.otp },
        "OTP sent for profile update verification"
      )
    );
});

// Verify OTP and update the astrologer profile
export const verifyAstrologerProfileUpdateOTP = asyncHandler(
  async (req, res) => {
    const { id } = req.params;
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      throw new ApiError(400, "Phone number and OTP are required");
    }

    const updateRequest = await UpdateAstrologerProfile.findOne({ phone });
    if (!updateRequest) {
      throw new ApiError(404, "Profile update request not found");
    }

    if (updateRequest.otp !== otp) {
      return res.status(400).json(new ApiResponse(400, null, "Invalid OTP"));
    }

    const astrologer = await Astrologer.findOneAndUpdate(
      { authId: id },
      {
        Fname: updateRequest.Fname,
        Lname: updateRequest.Lname,
        phone: updateRequest.phone,
        specialisation: updateRequest.specialisation,
        chat_price: updateRequest.chat_price,
        video_price: updateRequest.video_price,
        call_price: updateRequest.call_price,
        years_of_experience: updateRequest.years_of_experience,
        profile_picture: updateRequest.profile_picture,
        description: updateRequest.description,
        language: updateRequest.language,
        certifications: updateRequest.certifications,
      },
      { new: true }
    );

    if (!astrologer) {
      throw new ApiError(404, "Astrologer profile not found");
    }

    const authRecord = await Auth.findByIdAndUpdate(
      id,
      {
        Fname: updateRequest.Fname,
        Lname: updateRequest.Lname,
        phone: updateRequest.phone,
        isVerified: true,
      },
      { new: true }
    );

    if (!authRecord) {
      throw new ApiError(404, "Auth record not found");
    }

    // Update User record
    const userRecord = await User.findOneAndUpdate(
      { authId: id },
      {
        Fname: updateRequest.Fname,
        Lname: updateRequest.Lname,
        phone: updateRequest.phone,
        isVerified: true,
        years_of_experience: updateRequest.years_of_experience,
        profile_picture: updateRequest.profile_picture,
        description: updateRequest.description,
        language: updateRequest.language,
        certifications: updateRequest.certifications,
      },
      { new: true }
    );

    if (!userRecord) {
      throw new ApiError(404, "User record not found");
    }

    await updateRequest.deleteOne();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          astrologer,
          authRecord,
          userRecord,
        },
        "Astrologer updated successfully"
      )
    );
  }
);

// Get all update request astrologers
export const getAllUpdateRequestAstrologers = asyncHandler(async (req, res) => {
  const updateRequests = await UpdateAstrologerProfile.find();

  if (updateRequests.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No update request astrologers found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateRequests,
        "All update request astrologers retrieved successfully"
      )
    );
});

// Get update request astrologer by ID
export const getUpdateRequestAstrologerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateRequest = await UpdateAstrologerProfile.findById(id);

  if (!updateRequest) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Update request astrologer not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateRequest,
        "Update request astrologer retrieved successfully"
      )
    );
});

// Approve Astrologer Request
export const approveAstrologer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the AstrologerRequest by ID
  const astrologerRequest = await AstrologerRequest.findById(id);
  if (!astrologerRequest) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Astrologer not found"));
  }

  // Generate a unique promo code
  const promoCode = await generateUniquePromoCode();

  // Create a new Astrologer record
  const newAstrologer = new Astrologer({
    authId: astrologerRequest.authId,
    userId: astrologerRequest.userId,
    Fname: astrologerRequest.Fname,
    Lname: astrologerRequest.Lname,
    phone: astrologerRequest.phone,
    specialisation: astrologerRequest.specialisation,
    rating: 0,
    total_number_service_provide: 0,
    total_earning: 0,
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
    chat_price: astrologerRequest.chat_price,
    video_price: astrologerRequest.video_price,
    call_price: astrologerRequest.call_price || 200,
    years_of_experience: astrologerRequest.years_of_experience,
    profile_picture: astrologerRequest.profile_picture,
    description: astrologerRequest.description,
    language: astrologerRequest.language,
    certifications: astrologerRequest.certifications,
    adhar_card: astrologerRequest.adhar_card,
    pan_card: astrologerRequest.pan_card,
    promo_code: promoCode,
  });

  await newAstrologer.save();

  // Delete the AstrologerRequest record
  await astrologerRequest.deleteOne();

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        newAstrologer,
        "Astrologer approved and created successfully"
      )
    );
});

// Reject Astrologer Request
export const rejectAstrologer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectMessage } = req.body;

  // Find the AstrologerRequest by ID
  const astrologerRequest = await AstrologerRequest.findById(id);
  if (!astrologerRequest) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Astrologer request not found"));
  }

  // Update the AstrologerRequest record
  astrologerRequest.request_status = "rejected";
  astrologerRequest.request_status_message =
    rejectMessage || "Astrologer request rejected";
  await astrologerRequest.save();

  // Schedule the deletion of the astrologer request after 24 hours
  setTimeout(
    async () => {
      const requestToDelete = await AstrologerRequest.findById(id);
      if (requestToDelete && requestToDelete.request_status === "rejected") {
        await requestToDelete.deleteOne();
        console.log(`AstrologerRequest with ID ${id} deleted after 24 hours.`);
      }
    },
    24 * 60 * 60 * 1000
  ); // 24 hours in milliseconds

  return res
    .status(200)
    .json(
      new ApiResponse(200, null, "Astrologer request rejected successfully")
    );
});

// Add balance to astrologer's wallet using userId
export const addBalanceToAstrologerWallet = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // Extract userId from URL params
    const { amount, description, reference, transactionId } = req.body; // Extract details from request body

    // Ensure the amount is positive
    if (amount <= 0) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Amount must be greater than zero"));
    }

    // Find the astrologer by userId
    const astrologer = await Astrologer.findById(id); // Use the userId in the URL params

    if (!astrologer) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Astrologer not found"));
    }

    // Add balance to astrologer's wallet
    astrologer.wallet.balance += amount;

    // Create the transaction entry
    const transaction = {
      type: "credit", // Since we are adding balance, it's a credit transaction
      amount,
      description: description || "Balance added",
      reference: reference || "N/A",
      transactionId, // Include the generated transactionId here
    };

    // Add the transaction to the astrologer's transaction history
    astrologer.wallet.transactionHistory.push(transaction);

    // Save the updated astrologer document
    await astrologer.save();

    // Return the updated wallet balance
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { balance: astrologer.wallet.balance },
          "Balance added successfully"
        )
      );
  } catch (error) {
    console.error("Error adding balance:", error.message);
    const statusCode = error.statusCode || 500;
    const message =
      error.message || "An error occurred while adding balance to wallet";
    res
      .status(statusCode)
      .json(new ApiResponse(statusCode, null, message, error));
  }
});

// Update Astrologer by ID
export const updateAstrologerById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const {
      specialisation,
      chat_price,
      video_price,
      call_price,
      years_of_experience,
      profile_picture,
      description,
      language,
      certifications,
    } = req.body;

    if (!id) {
      throw new ApiError(400, "Astrologer ID is required");
    }

    const astrologer = await Astrologer.findByIdAndUpdate(
      id,
      {
        specialisation,
        chat_price,
        video_price,
        call_price,
        years_of_experience,
        profile_picture,
        description,
        language,
        certifications,
      },
      { new: true, runValidators: true }
    );

    if (!astrologer) {
      throw new ApiError(404, "Astrologer not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, astrologer, "Astrologer updated successfully")
      );
  } catch (error) {
    throw error;
  }
});

// Filter astrologers by multiple specializations
export const filterAstrologersBySpecialization = asyncHandler(
  async (req, res) => {
    try {
      // Get the specializations from the request body
      const { specializations } = req.body;
      console.log(specializations);

      // Validate that specializations are provided and is an array
      if (
        !specializations ||
        !Array.isArray(specializations) ||
        specializations.length === 0
      ) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              null,
              "Specializations must be a non-empty array"
            )
          );
      }

      // Query the astrologers based on the multiple specializations
      const astrologers = await Astrologer.find({
        specialisation: { $in: specializations },
      })
        .select("-wallet") // Exclude wallet from response
        .populate("specialisation"); // Populate the specialisation field

      // If no astrologers are found, return a 404 response
      if (astrologers.length === 0) {
        return res
          .status(404)
          .json(
            new ApiResponse(
              404,
              null,
              "No astrologers found for the given specializations"
            )
          );
      }

      // Return the filtered astrologers
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            astrologers,
            "Astrologers filtered by specializations successfully"
          )
        );
    } catch (error) {
      // Handle any errors
      console.error("Error filtering astrologers by specializations:", error);
      return res
        .status(500)
        .json(
          new ApiResponse(500, null, "Internal Server Error", error.message)
        );
    }
  }
);

// Delete Astrologer by ID
export const deleteAstrologerById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Astrologer ID is required");
    }

    const astrologer = await Astrologer.findById(id);
    if (!astrologer) {
      throw new ApiError(404, "Astrologer not found");
    }

    const { phone } = astrologer;

    await astrologer.deleteOne();

    const authRecord = await Auth.findOneAndDelete({ phone });
    if (!authRecord) {
      throw new ApiError(404, "Auth record not found for the astrologer");
    }

    const userRecord = await User.findOneAndDelete({ phone });
    if (!userRecord) {
      throw new ApiError(404, "User record not found for the astrologer");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Your account deleted successfully"));
  } catch (error) {
    throw error;
  }
});

// Get wallet balance by ID
export const getWalletBalanceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the Astrologer by ID
  const astrologer = await Astrologer.findById(id);
  if (!astrologer) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Astrologer not found"));
  }

  // Get the wallet balance
  const walletBalance = astrologer.wallet.balance;

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

// Add a review to an astrologer
export const giveReviewToAstrologer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // Astrologer ID
    const { userId, rating, comment } = req.body; // Review details

    // Validate inputs
    if (!userId || !rating || !comment) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "All fields are required"));
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Rating must be between 1 and 5"));
    }

    // Find the astrologer by ID
    const astrologer = await Astrologer.findById(id);
    if (!astrologer) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Astrologer not found"));
    }

    // Add the review to the astrologer's reviews array
    const newReview = {
      userId,
      rating,
      comment,
    };

    astrologer.reviews.push(newReview);
    await astrologer.save();

    return res
      .status(200)
      .json(new ApiResponse(200, newReview, "Review added successfully"));
  } catch (error) {
    console.error("Error adding review:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "An error occurred while adding the review")
      );
  }
});

// Get all reviews for an astrologer by their ID
export const getAllReviewsByAstrologerId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // Astrologer ID

    // Validate ID
    if (!id) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Astrologer ID is required"));
    }

    // Find the astrologer by ID and populate reviews
    const astrologer = await Astrologer.findById(id, "reviews").lean();

    if (!astrologer) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Astrologer not found"));
    }

    // Check if there are no reviews
    if (!astrologer.reviews || astrologer.reviews.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, [], "No reviews found for this astrologer"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          astrologer.reviews,
          "Reviews retrieved successfully"
        )
      );
  } catch (error) {
    console.error("Error retrieving reviews:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(500, null, "An error occurred while fetching reviews")
      );
  }
});

// Get wallet transaction history by ID
export const getWalletTransactionHistoryById = asyncHandler(
  async (req, res) => {
    const { id } = req.params;

    // Find the Astrologer by ID
    const astrologer = await Astrologer.findById(id);
    if (!astrologer) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Astrologer not found"));
    }

    // Get the wallet transaction history
    const transactionHistory = astrologer.wallet.transactionHistory;

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { transactions: transactionHistory },
          "Wallet transaction history retrieved successfully"
        )
      );
  }
);
