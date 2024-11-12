import { User } from "../../models/auth/user.model.js";
import { Matrimony } from "../../models/matrimony/matrimony.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Create Matrimony Profile
export const createMatrimonyProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    Fname,
    Lname,
    photo,
    city,
    state,
    gender,
    salary,
    age,
    subs_plan_name,
    subs_start_date,
    bio,
    isDivorce,
    cast,
    interests,
    searching_for,
    whatsappNumber,
    facebookLink,
  } = req.body;

  const existsUser = await User.findById(id);

  if (!existsUser) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  const existingMatrimonyProfile = await Matrimony.findOne({ userId: id });

  if (existingMatrimonyProfile) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Matrimony profile already exists"));
  }

  const { isAstrologer, isAffiliate_marketer, isAdmin } = existsUser;

  if (!isAstrologer && !isAffiliate_marketer && !isAdmin) {
    try {
      const newMatrimonyProfile = new Matrimony({
        authId: existsUser.authId,
        userId: existsUser._id,
        Fname,
        Lname,
        photo,
        city,
        state,
        salary,
        age,
        gender,
        subs_plan_name,
        subs_start_date,
        bio,
        isDivorce,
        cast,
        interests,
        searching_for,
        facebookLink,
        whatsappNumber,
      });

      await newMatrimonyProfile.save();

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            newMatrimonyProfile,
            "Matrimony profile created successfully"
          )
        );
    } catch (error) {
      if (error.name === "ValidationError") {
        const errorMessages = Object.values(error.errors).map(
          (err) => err.message
        );
        console.log(errorMessages);
        return res
          .status(400)
          .json(new ApiResponse(400, null, "Validation error", errorMessages));
      }
      return res
        .status(500)
        .json(new ApiResponse(500, null, "An unexpected error occurred"));
    }
  } else {
    return res
      .status(403)
      .json(
        new ApiResponse(
          403,
          null,
          "This user cannot create a matrimony profile"
        )
      );
  }
});

// Get all Matrimony Profiles
export const getAllMatrimonyProfile = asyncHandler(async (req, res) => {
  const matrimonyProfiles = await Matrimony.find();

  if (!matrimonyProfiles.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No matrimony profiles found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        matrimonyProfiles,
        "Matrimony profiles retrieved successfully"
      )
    );
});

// Get Matrimony Profile by User ID
export const getMatrimonyProfileByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const matrimonyProfile = await Matrimony.findOne({ userId: id });

  if (!matrimonyProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Matrimony profile not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        matrimonyProfile,
        "Matrimony profile retrieved successfully"
      )
    );
});

// Update Matrimony Profile by User ID
export const updateMatrimonyProfileByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const updatedProfile = await Matrimony.findOneAndUpdate(
      { userId: id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Matrimony profile not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedProfile,
          "Matrimony profile updated successfully"
        )
      );
  } catch (error) {
    if (error.name === "ValidationError") {
      const errorMessages = Object.values(error.errors).map(
        (err) => err.message
      );
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Validation error", errorMessages));
    }
    return res
      .status(500)
      .json(new ApiResponse(500, null, "An unexpected error occurred"));
  }
});

// Get 5 Random Groom Profiles
export const getRandomGrooms = asyncHandler(async (req, res) => {
  const grooms = await Matrimony.aggregate([
    { $match: { searching_for: "groom" } },
    { $sample: { size: 5 } },
  ]);

  if (!grooms.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No groom profiles found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        grooms,
        "Random groom profiles retrieved successfully"
      )
    );
});

// Get 5 Random Bride Profiles
export const getRandomBrides = asyncHandler(async (req, res) => {
  const brides = await Matrimony.aggregate([
    { $match: { searching_for: "bride" } },
    { $sample: { size: 5 } },
  ]);

  if (!brides.length) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No bride profiles found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        brides,
        "Random bride profiles retrieved successfully"
      )
    );
});

// Send Like to a Matrimony Profile with senderId and receiverId from params
export const sendLikeMatrimony = asyncHandler(async (req, res) => {
  const { senderId, receiverId } = req.params;

  const senderProfile = await Matrimony.findOne({ userId: senderId });
  const receiverProfile = await Matrimony.findOne({ userId: receiverId });

  if (!senderProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Sender profile not found"));
  }

  if (!receiverProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Receiver profile not found"));
  }

  // Ensure sent_likes_id and pending_likes_id are arrays
  senderProfile.sent_likes_id = senderProfile.sent_likes_id || [];
  receiverProfile.pending_likes_id = receiverProfile.pending_likes_id || [];

  // Check if the like has already been sent
  if (senderProfile.sent_likes_id.includes(receiverId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Like already sent to this profile"));
  }

  try {
    senderProfile.sent_likes_id.push(receiverId);
    await senderProfile.save();

    receiverProfile.pending_likes_id.push(senderId);
    await receiverProfile.save();

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Like sent successfully"));
  } catch (error) {
    if (error.name === "ValidationError") {
      // Extract the specific validation error messages
      const messages = Object.values(error.errors).map((err) => err.message);
      return res
        .status(400)
        .json(
          new ApiResponse(400, null, `Validation Error: ${messages.join(", ")}`)
        );
    }
    console.log(error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "An error occurred while sending like"));
  }
});

// Fetch Pending Likes Excluding Sent Likes
export const getPendingLikesProfilesMatrimony = asyncHandler(
  async (req, res) => {
    const { userId } = req.params;

    // Fetch the user’s profile to access pending_likes_id and sent_likes_id
    const userProfile = await Matrimony.findOne({ userId });

    if (!userProfile) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "User profile not found"));
    }

    // Ensure sent_likes_id and pending_likes_id are initialized
    const sentLikes = userProfile.sent_likes_id || [];
    const pendingLikes = userProfile.pending_likes_id || [];

    // Filter pending likes to exclude those already in sent likes
    const filteredPendingLikes = pendingLikes.filter(
      (likeId) => !sentLikes.includes(likeId.toString())
    );

    // If there are no pending likes, send a specific message
    if (filteredPendingLikes.length === 0) {
      return res
        .status(200)
        .json(new ApiResponse(200, null, "No pending likes found"));
    }

    // Fetch detailed profiles for each filtered pending like ID
    const pendingLikeProfiles = await Matrimony.find({
      userId: { $in: filteredPendingLikes },
    }).select(
      "Fname Lname photo city state age gender bio cast salary interests isDivorce"
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          pendingLikeProfiles,
          "Pending likes retrieved successfully, excluding sent likes"
        )
      );
  }
);

// Fetch Sent Likes Profiles
export const getSentLikesProfilesMatrimony = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Fetch the user’s matrimony profile to access sent_likes_id
  const userProfile = await Matrimony.findOne({ userId });

  if (!userProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "User profile not found"));
  }

  // Ensure sent_likes_id is initialized
  const sentLikes = userProfile.sent_likes_id || [];

  // Check if there are no sent likes
  if (sentLikes.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No sent likes found"));
  }

  // Fetch detailed profiles for each user in sent_likes_id
  const sentLikeProfiles = await Matrimony.find({
    userId: { $in: sentLikes },
  }).select(
    "Fname Lname photo city state age gender bio cast salary interests isDivorce"
  );

  // If no profiles are found for sent likes, return null with a relevant message
  if (sentLikeProfiles.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No sent likes profiles found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        sentLikeProfiles,
        "Sent likes profiles retrieved successfully"
      )
    );
});

// Delete Matrimony Profile by User ID
export const deleteMatrimonyProfileByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find and delete the Matrimony profile by userId
  const deletedProfile = await Matrimony.findOneAndDelete({ userId: id });

  if (!deletedProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Matrimony profile not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Matrimony profile deleted successfully"));
});
