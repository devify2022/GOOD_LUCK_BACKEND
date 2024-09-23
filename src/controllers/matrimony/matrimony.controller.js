import { User } from "../../models/auth/user.model.js";
import { Matrimony } from "../../models/matrimony/matrimony.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Create Matrimony Profile
export const createMatrimonyProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const {
    photo,
    city,
    state,
    salary,
    age,
    subs_plan_name,
    subs_start_date,
    bio,
    isDivorce,
    cast,
    interests,
    searching_for,
  } = req.body;

  const existsUser = await User.findOne({ userId: id });

  if (!existsUser) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  const existingMatrimonyProfile = await Matrimony.findOne({ authId: id });

  if (existingMatrimonyProfile) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Matrimony profile already exists"));
  }

  const { isAstrologer, isAffiliate_marketer, isAdmin } = existsUser;

  if (!isAstrologer && !isAffiliate_marketer && !isAdmin) {
    const newMatrimonyProfile = new Matrimony({
      authId: id,
      userId: existsUser._id,
      Fname: existsUser.Fname,
      Lname: existsUser.Lname,
      photo,
      city,
      state,
      salary,
      age,
      gender: existsUser.gender,
      subs_plan_name,
      subs_start_date,
      bio,
      isDivorce,
      cast,
      interests,
      searching_for,
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

  const {
    photo,
    city,
    state,
    salary,
    age,
    subs_plan_name,
    subs_start_date,
    bio,
    isDivorce,
    pending_likes_id,
    sent_likes_id,
    cast,
    interests,
    searching_for,
  } = req.body;

  // Find and update the Matrimony profile by userId
  const updatedProfile = await Matrimony.findOneAndUpdate(
    { userId: id },
    {
      photo,
      city,
      state,
      salary,
      age,
      subs_plan_name,
      subs_start_date,
      bio,
      isDivorce,
      pending_likes_id,
      sent_likes_id,
      cast,
      interests,
      searching_for,
    },
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
