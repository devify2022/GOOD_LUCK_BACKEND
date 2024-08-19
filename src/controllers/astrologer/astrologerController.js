import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { UpdateAstrologerProfile } from "../../models/astrologer/updateAstrologer.model.js";
import generateOtp from "../../utils/otpGenerate.js";
import { User } from "../../models/auth/user.model.js";
import { Astrologer } from "../../models/astrologer/astroler.model.js";
import { Auth } from "../../models/auth/auth.model.js";

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
            userId: existsAstrologer._id,
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

  const astrologer = await Astrologer.findById(id);
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

    const isOtpValid = updateRequest.verifyOtp(otp);
    if (!isOtpValid) {
      throw new ApiError(400, "Invalid OTP or OTP has expired");
    }

    const astrologer = await Astrologer.findOneAndUpdate(
      { userId: id },
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
      { userId: id }, 
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
