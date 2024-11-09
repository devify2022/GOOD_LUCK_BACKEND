import { User } from "../../models/auth/user.model.js";
import { Dating } from "../../models/dating/dating.model.js";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Create Dating Profile
export const createDatingProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const {
      Fname, // Add Fname
      Lname, // Add Lname
      photos,
      city,
      state,
      age,
      subs_plan_name,
      subs_start_date,
      bio,
      smoker,
      alcoholic,
      education,
      orientation,
      interests,
      looking_for,
    } = req.body;

    const existsUser = await User.findById(id);

    if (!existsUser) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    const existingDatingProfile = await Dating.findOne({ userId: id });

    if (existingDatingProfile) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Dating profile already exists"));
    }

    const { isAstrologer, isAffiliate_marketer, isAdmin } = existsUser;

    if (!isAstrologer && !isAffiliate_marketer && !isAdmin) {
      const newDatingProfile = new Dating({
        authId: existsUser.authId,
        userId: existsUser._id,
        Fname, // Add Fname
        Lname, // Add Lname
        photos,
        city,
        age,
        state,
        subs_plan_name,
        subs_start_date,
        bio,
        smoker,
        alcoholic,
        education,
        orientation,
        interests,
        looking_for,
      });

      await newDatingProfile.save();

      return res
        .status(201)
        .json(
          new ApiResponse(
            201,
            newDatingProfile,
            "Dating profile created successfully"
          )
        );
    } else {
      return res
        .status(403)
        .json(
          new ApiResponse(403, null, "This user cannot create a dating profile")
        );
    }
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

// Get All Dating Profiles
export const getAllDatingProfiles = asyncHandler(async (req, res) => {
  try {
    const datingProfiles = await Dating.find();

    if (!datingProfiles.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No dating profiles found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          datingProfiles,
          "Dating profiles retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get Single Dating Profile by ID
export const getDatingProfileByUserId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const datingProfile = await Dating.findOne({ userId: id });

    if (!datingProfile) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Dating profile not found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          datingProfile,
          "Dating profile retrieved successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Update Dating Profile
export const updateDatingProfileByUserId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const updatedProfile = await Dating.findOneAndUpdate(
      { userId: id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedProfile) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Dating profile not found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedProfile,
          "Dating profile updated successfully"
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

// Send Like API for Dating Profile with senderId and receiverId from params
export const sendLikeDating = asyncHandler(async (req, res) => {
  const { senderId, receiverId } = req.params; // Extract senderId and receiverId from params

  // Fetch the sender's dating profile
  const senderProfile = await Dating.findOne({ userId: senderId });

  if (!senderProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Sender profile not found"));
  }

  // Fetch the target profile's dating profile
  const targetProfile = await Dating.findOne({ userId: receiverId });

  if (!targetProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Target profile not found"));
  }

  // Ensure sent_likes_id and pending_likes_id are arrays
  senderProfile.sent_likes_id = senderProfile.sent_likes_id || [];
  targetProfile.pending_likes_id = targetProfile.pending_likes_id || [];

  // Check if the like has already been sent
  if (senderProfile.sent_likes_id.includes(receiverId)) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Like already sent to this profile"));
  }

  // Check if the target profile already has the sender in their pending likes
  if (targetProfile.pending_likes_id.includes(senderId)) {
    // If the sender is already in the pending likes of the target profile, move it to sent_likes_id
    targetProfile.sent_likes_id.push(senderId);
    targetProfile.pending_likes_id = targetProfile.pending_likes_id.filter(
      (id) => !id.equals(senderId)
    );
    await targetProfile.save();
  } else {
    // If not, add the sender to the target profile's pending likes
    targetProfile.pending_likes_id.push(senderId);
    await targetProfile.save();
  }

  // Add the target profile's userId to the sender's sent_likes_id
  senderProfile.sent_likes_id.push(receiverId);
  await senderProfile.save();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Like sent successfully"));
});

// Get Pending Likes Profiles API
export const getPendingLikesProfilesDating = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Fetch the user's dating profile
  const userProfile = await Dating.findOne({ userId });

  if (!userProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "User profile not found"));
  }

  // Get the pending likes (user IDs)
  const pendingLikes = userProfile.pending_likes_id;

  if (pendingLikes.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No pending likes found"));
  }

  // Get the sent likes to exclude them from pending likes
  const sentLikes = userProfile.sent_likes_id;

  // Filter pending likes to exclude those that are already in sent likes
  const filteredPendingLikes = pendingLikes.filter(
    (pendingLikeId) =>
      !sentLikes.some((sentLikeId) => sentLikeId.equals(pendingLikeId))
  );

  if (filteredPendingLikes.length === 0) {
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          null,
          "No pending likes left after excluding sent likes"
        )
      );
  }

  // Fetch profiles of users who have pending likes for this user
  const pendingProfiles = await Dating.find({
    userId: { $in: filteredPendingLikes },
  }).select("Fname Lname photos city state age gender bio");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        pendingProfiles,
        "Pending likes retrieved successfully"
      )
    );
});

// Get Sent Likes Profiles API
export const getSentLikesProfilesDating = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Fetch the user's dating profile
  const userProfile = await Dating.findOne({ userId });

  if (!userProfile) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "User profile not found"));
  }

  // Get the sent likes (user IDs)
  const sentLikes = userProfile.sent_likes_id;

  if (sentLikes.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "No sent likes found"));
  }

  // Fetch profiles of users to whom the current user has sent likes
  const sentProfiles = await Dating.find({ userId: { $in: sentLikes } }).select(
    "Fname Lname photos city state age gender bio"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        sentProfiles,
        "Sent likes profiles retrieved successfully"
      )
    );
});

// Delete Dating Profile
export const deleteDatingProfileByUserId = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the dating profile
    const deletedProfile = await Dating.findOneAndDelete({ userId: id });

    if (!deletedProfile) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Dating profile not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, null, "Dating profile deleted successfully"));
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});
