import { HomeLandBanner } from "../../models/advertisement/homeLandBanner.model.js";
import { ServiceAds } from "../../models/advertisement/service.model.js";
import { User } from "../../models/auth/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import handleValidationError from "../../utils/validationError.js";

// Create a HomeBanner ad and a corresponding ServiceAd
export const createHomeLandBannerAd = async (req, res, next) => {
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
    // Step 1: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Check if the user is verified
    if (!user.isVerified) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "User is not verified"));
    }

    // Step 3: Proceed with the creation of the HomeBannerAd
    const homeLandBannerAd = await HomeLandBanner.create({
      userId,
      city,
      state,
      pincode,
      phone: phone || user.phone,
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

    // Step 4: Create the corresponding ServiceAd
    const serviceAd = await ServiceAds.create({
      userId,
      homeAdType: "HomeLandBanner",
      homeLandAdId: homeLandBannerAd._id,
      jobAdType: null,
      job_ads: null,
      generale_ads: null,
    });

    // Return the success response
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { homeLandBannerAd, serviceAd },
          "Ad created successfully"
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

// Get all HomeBanner ads
export const getAllHomeLandBannerAds = async (req, res, next) => {
  try {
    const homeLandBannerAds = await HomeLandBanner.find();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandBannerAds,
          "Fetched ads successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};

// Get HomeBanner ads by userId
export const getHomeLandBannerAdsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  try {
    // Step 1: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: If user is found, fetch the HomeBanner ads for that user
    const homeLandBannerAds = await HomeLandBanner.find({ userId });
    // Step 3: Return the success response
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandBannerAds,
          `Fetched ads for userId: ${userId}`
        )
      );
  } catch (error) {
    next(error);
  }
};

// Get HomeLandBanner ads by userId and category (Home/Land)
export const getHomeLandBannerAdsByUserIdAndCategory = async (
  req,
  res,
  next
) => {
  const { userId, category } = req.params;

  try {
    // Step 1: Validate category
    if (!["Home", "Land"].includes(category)) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            "Invalid category. Must be 'Home' or 'Land'."
          )
        );
    }

    // Step 2: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 3: Fetch the HomeLandBanner ads for that user and category
    const homeLandBannerAds = await HomeLandBanner.find({
      userId,
      category,
    });

    // Step 4: Check if any ads are found
    if (homeLandBannerAds.length === 0) {
      // If no ads found, send null as the data
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            null,
            `No ads found for userId: ${userId} and category: ${category}`
          )
        );
    }

    // Step 5: Return the success response with the ads if found
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandBannerAds,
          `Fetched ads for userId: ${userId} and category: ${category}`
        )
      );
  } catch (error) {
    next(error);
  }
};

// Update HomeBanner ad by userId
export const updateHomeLandBannerAdByUserId = async (req, res, next) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    // Step 1: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Find and update the HomeBanner ad for the user
    const homeLandBannerAds = await HomeLandBanner.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!homeLandBannerAds) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `No ad found for userId: ${userId}`
          )
        );
    }

    // Step 3: Update the corresponding ServiceAd if homeAdType or homeLandAdId is modified
    if (updateData.homeAdType || updateData.homeLandAdId) {
      await ServiceAds.updateOne(
        { userId, homeLandAdId: homeLandBannerAds._id },
        { homeAdType: "HomeLandBanner", homeLandAdId: homeLandBannerAds._id }
      );
    }

    // Step 4: Return the success response
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandBannerAds,
          "Ad updated successfully"
        )
      );
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = handleValidationError(error);
      res
        .status(400)
        .json(new ApiResponse(400, { errors }, "Validation error occurred"));
    } else {
      next(error);
    }
  }
};

// Delete HomeBanner ad by userId
export const deleteHomeLandBannerAdByUserId = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Step 1: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Delete the HomeBanner ad for the user
    const homeLandBannerAds = await HomeLandBanner.findOneAndDelete({ userId });

    if (!homeLandBannerAds) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `No ad found for userId: ${userId}`
          )
        );
    }

    // Step 3: Delete the corresponding ServiceAd
    await ServiceAds.deleteOne({ userId, homeLandAdId: homeLandBannerAds._id });

    // Step 4: Return the success response
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandBannerAds,
          "Ad deleted successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};
