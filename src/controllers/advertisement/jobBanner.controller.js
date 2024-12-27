import { JobBanner } from "../../models/advertisement/jobBanner.model.js";
import { ServiceAds } from "../../models/advertisement/service.model.js";
import { User } from "../../models/auth/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import handleValidationError from "../../utils/validationError.js";

// Create a JobBanner ad and a corresponding ServiceAd
export const createJobBannerAd = async (req, res, next) => {
  const {
    userId,
    city,
    state,
    pincode,
    phone,
    banner_url,
    is_subscribed,
    subs_plan,
    subs_start_date,
    subs_end_date,
    transaction_id,
    is_promoCode_applied,
    promocode,
    category,
  } = req.body;

  try {
    // Step 1: Validate user existence
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Create the JobBanner ad
    const jobBannerAd = await JobBanner.create({
      userId,
      city,
      state,
      pincode,
      phone,
      banner_url,
      is_subscribed,
      subs_plan,
      subs_start_date,
      subs_end_date,
      transaction_id,
      is_promoCode_applied,
      promocode,
      category,
    });

    // Step 3: Automatically create the ServiceAd
    const serviceAd = await ServiceAds.create({
      userId,
      jobAdType: "JobBanner",
      job_ad_id: jobBannerAd._id,
      homeAdType: null, // Adjust as per your logic
      home_ads: null,
      generale_ads: null,
    });

    // Step 4: Respond with success
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { jobBannerAd, serviceAd },
          "JobBanner and ServiceAd created successfully"
        )
      );
  } catch (error) {
    // Handle validation errors
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json(
          new ApiResponse(400, handleValidationError(error), "Validation error")
        );
    }
    // Pass other errors to the error handler middleware
    next(error);
  }
};

// Get all JobBanner ads
export const getAllJobBannerAds = async (req, res, next) => {
  try {
    const jobBannerAds = await JobBanner.find();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          jobBannerAds,
          "Fetched all JobBanner ads successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};

// Get JobBanner ads by userId
export const getJobBannerAdsByUserId = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Step 1: Check if the user exists
    const user = await User.findById(userId); // Assuming you have a User model
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Fetch JobBanner ads for the user
    const jobBannerAds = await JobBanner.find({ userId });

    // Step 3: Respond with the JobBanner ads
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          jobBannerAds,
          `Fetched JobBanner ads for userId: ${userId}`
        )
      );
  } catch (error) {
    next(error); // Pass errors to the error handling middleware
  }
};

// Update JobBanner ad by userId
export const updateJobBannerAdByUserId = async (req, res, next) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    // Step 1: Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Update the JobBanner ad
    const jobBannerAd = await JobBanner.findOneAndUpdate(
      { userId },
      updateData,
      { new: true } // Return the updated document
    );

    if (!jobBannerAd) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `No JobBanner ad found for userId: ${userId}`
          )
        );
    }

    // Step 3: Optionally update ServiceAds if relevant
    if (updateData.jobAdType || updateData.job_ad_id) {
      await ServiceAds.updateOne(
        { userId, job_ad_id: jobBannerAd._id },
        { jobAdType: "JobBanner", job_ad_id: jobBannerAd._id }
      );
    }

    // Step 4: Respond with success
    res
      .status(200)
      .json(
        new ApiResponse(200, jobBannerAd, "JobBanner ad updated successfully")
      );
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

// Delete JobBanner ad by userId
export const deleteJobBannerAdByUserId = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Step 1: Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Delete the JobBanner ad
    const jobBannerAd = await JobBanner.findOneAndDelete({ userId });

    if (!jobBannerAd) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `No JobBanner ad found for userId: ${userId}`
          )
        );
    }

    // Step 3: Delete associated ServiceAds
    await ServiceAds.deleteOne({ userId, job_ad_id: jobBannerAd._id });

    // Step 4: Respond with success
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          jobBannerAd,
          "JobBanner ad and associated ServiceAd deleted successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};
