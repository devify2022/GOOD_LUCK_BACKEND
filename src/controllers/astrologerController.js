import { User } from "../models/user.model.js";
import { Astrologer } from "../models/astroler.model.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Create Astrologer
export const createAstrologer = asyncHandler(async (req, res) => {
  try {
    const {
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

    if (
      !phone ||
      !specialisation ||
      !chat_price ||
      !video_price ||
      !years_of_experience ||
      !profile_picture ||
      !description ||
      !language ||
      !certifications
    ) {
      throw new ApiError(400, "All required fields must be provided");
    }

    const existsUser = await User.findOne({ phone });
    const existsAstrologer = await Astrologer.findOne({ phone });

    if (existsUser) {
      if (existsUser.isAstrologer) {
        if (!existsAstrologer) {
          const astrologer = new Astrologer({
            userId: existsUser._id,
            Fname: existsUser.Fname,
            Lname: existsUser.Lname,
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
          throw new ApiError(400, "User is already an astrologer");
        }
      } else {
        throw new ApiError(
          400,
          "Phone number is already used by a normal user"
        );
      }
    } else {
      throw new ApiError(404, "User not found");
    }
  } catch (error) {
    throw error;
  }
});

// Get all astrologers
export const getAllAstrologers = asyncHandler(async (req, res) => {
  try {
    const astrologers = await Astrologer.find();

    if (astrologers.length === 0) {
      throw new ApiError(404, "No astrologers found");
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

// Delete Astrologer by ID
export const deleteAstrologerById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ApiError(400, "Astrologer ID is required");
    }

    const astrologer = await Astrologer.findByIdAndDelete(id);

    if (!astrologer) {
      throw new ApiError(404, "Astrologer not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Astrologer deleted successfully"));
  } catch (error) {
    throw error;
  }
});
