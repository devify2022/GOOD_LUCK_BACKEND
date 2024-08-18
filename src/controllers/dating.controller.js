import { User } from "../models/auth/user.model.js";
import { Dating } from "../models/dating/dating.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create Dating Profile
export const createDatingProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const {
      city,
      state,
      subs_plan_name,
      subs_start_date,
      bio,
      smoker,
      alcoholic,
      pending_likes_id,
      sent_likes_id,
      education,
      orientation,
      interests,
      looking_for,
    } = req.body;

    const existsUser = await User.findOne({ userId: id });

    if (!existsUser) {
      throw new ApiError(404, "User not found");
    }

    const existingDatingProfile = await Dating.findOne({ authId: id });

    if (existingDatingProfile) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Dating profile already exists"));
    }

    const { isAstrologer, isAffiliate_marketer, isAdmin } = existsUser;

    if (!isAstrologer && !isAffiliate_marketer && !isAdmin) {
      const newDatingProfile = new Dating({
        authId: id,
        userId: existsUser._id,
        city,
        state,
        subs_plan_name,
        subs_start_date,
        bio,
        smoker,
        alcoholic,
        pending_likes_id,
        sent_likes_id,
        education,
        orientation,
        interests,
        looking_for,
      });

      await newDatingProfile.save();

      res
        .status(201)
        .json(
          new ApiResponse(
            201,
            newDatingProfile,
            "Dating profile created successfully"
          )
        );
    } else {
      res.status(201).json(new ApiResponse(500, "This is not a normal User"));
    }
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Get All Dating Profiles
export const getAllDatingProfiles = asyncHandler(async (req, res) => {
  try {
    const datingProfiles = await Dating.find().populate("userId");

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
export const getDatingProfileById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const datingProfile = await Dating.findOne({ userId: id }).populate(
      "userId"
    );

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
export const updateDatingProfile = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const {
      city,
      state,
      subs_plan_name,
      subs_start_date,
      bio,
      smoker,
      alcoholic,
      pending_likes_id,
      sent_likes_id,
      education,
      orientation,
      interests,
      looking_for,
    } = req.body;

    // Find and update the profile
    const updatedProfile = await Dating.findOneAndUpdate(
      { userId: id },
      {
        city,
        state,
        subs_plan_name,
        subs_start_date,
        bio,
        smoker,
        alcoholic,
        pending_likes_id,
        sent_likes_id,
        education,
        orientation,
        interests,
        looking_for,
      },
      { new: true, runValidators: true } // `new` returns the updated document, `runValidators` ensures validation
    );

    if (!updatedProfile) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Dating profile not found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedProfile,
          "Dating profile updated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(500, error.message);
  }
});

// Delete Dating Profile
export const deleteDatingProfile = asyncHandler(async (req, res) => {
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
