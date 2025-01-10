import { JobText } from "../../models/advertisement/jobText.model.js";
import { ServiceAds } from "../../models/advertisement/service.model.js";
import { User } from "../../models/auth/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import handleValidationError from "../../utils/validationError.js";

// Create a JobText ad and a corresponding ServiceAd
export const createJobTextAd = async (req, res, next) => {
  const {
    userId,
    title,
    salary,
    company_name,
    work_location,
    website,
    city,
    state,
    address,
    pincode,
    phone,
    text_ad_description,
    total_character,
    category,
  } = req.body;

  try {
    // Step 1: Validate user existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Check if the user is verified
    if (!user.isVerified) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User is not verified"));
    }

    // Step 3: Check if the user has an active subscription
    if (!user.adSubscription || !user.adSubscription.isSubscribed) {
      return res
        .status(403)
        .json(
          new ApiResponse(
            403,
            null,
            "User does not have an active subscription to create ads"
          )
        );
    }

    // Step 4: Create the JobText ad
    const jobTextAd = await JobText.create({
      userId,
      title,
      salary,
      company_name,
      work_location,
      website,
      city,
      state,
      address,
      pincode,
      phone: phone || user.phone, // Use user's phone if not provided
      text_ad_description,
      total_character,
      category,
    });

    // Step 5: Automatically create the ServiceAd
    const serviceAd = await ServiceAds.create({
      userId,
      jobAdType: "JobText",
      job_ad_id: jobTextAd._id,
      homeAdType: null,
      home_ads: null,
      generale_ads: null,
    });

    // Step 6: Add the ad ID to the user's adSubscription adsDetails
    user.adSubscription.adsDetails.push({
      adType: "JobText",
      adId: jobTextAd._id,
      details: {
        title,
        company_name,
        work_location,
        website,
        salary,
        city,
        state,
        address,
        pincode,
        text_ad_description,
        total_character,
        category,
      },
    });

    // Save the updated user
    await user.save();

    // Step 7: Respond with success
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { jobTextAd, serviceAd },
          "JobText and ServiceAd created successfully and added to subscription details"
        )
      );
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = handleValidationError(error);
      res
        .status(400)
        .json(new ApiResponse(400, { errors }, "Validation error occurred"));
    } else {
      next(error); // Pass other errors to the error handling middleware
    }
  }
};

// Get all JobText ads
export const getAllJobTextAds = async (req, res, next) => {
  try {
    const jobTextAds = await JobText.find();
    res
      .status(200)
      .json(
        new ApiResponse(200, jobTextAds, "Fetched all JobText ads successfully")
      );
  } catch (error) {
    next(error);
  }
};

// Get JobText ads by userId
export const getJobTextAdsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const jobTextAds = await JobText.find({ userId });
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          jobTextAds,
          `Fetched JobText ads for userId: ${userId}`
        )
      );
  } catch (error) {
    next(error);
  }
};

// Update JobText ad by userId
export const updateJobTextAdByUserId = async (req, res, next) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    const jobTextAd = await JobText.findOneAndUpdate(
      { userId },
      updateData,
      { new: true } // Return the updated document
    );

    if (!jobTextAd) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `No JobText ad found for userId: ${userId}`
          )
        );
    }

    // Optionally update ServiceAds if relevant
    if (updateData.jobAdType || updateData.job_ad_id) {
      await ServiceAds.updateOne(
        { userId, job_ad_id: jobTextAd._id },
        { jobAdType: "JobText", job_ad_id: jobTextAd._id }
      );
    }

    res
      .status(200)
      .json(new ApiResponse(200, jobTextAd, "JobText ad updated successfully"));
  } catch (error) {
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json(
          new ApiResponse(400, handleValidationError(error), "Validation error")
        );
    }
    next(error);
  }
};

// Delete JobText ad by userId
export const deleteJobTextAdByUserId = async (req, res, next) => {
  const { userId } = req.params;

  try {
    const jobTextAd = await JobText.findOneAndDelete({ userId });

    if (!jobTextAd) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `No JobText ad found for userId: ${userId}`
          )
        );
    }

    // Also delete associated ServiceAds
    await ServiceAds.deleteOne({ userId, job_ad_id: jobTextAd._id });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          jobTextAd,
          "JobText ad and associated ServiceAd deleted successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};
