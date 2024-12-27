import { HomeLandText } from "../../models/advertisement/homeLandText.model.js";
import { ServiceAds } from "../../models/advertisement/service.model.js";
import { User } from "../../models/auth/user.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import handleValidationError from "../../utils/validationError.js";

// Create a HomeText ad and a corresponding ServiceAd
export const createHomeLandTextAd = async (req, res, next) => {
  const {
    userId,
    city,
    state,
    pincode,
    phone,
    text_ad_description,
    total_character,
    category,
  } = req.body;

  try {
    // Step 1: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Proceed with the creation of the HomeText ad
    const homeLandTextAds = await HomeLandText.create({
      userId,
      city,
      state,
      pincode,
      phone: phone || user.phone, // Use user's phone if not provided
      text_ad_description,
      total_character,
      category,
    });

    // Step 3: Automatically create the corresponding ServiceAd
    const serviceAd = await ServiceAds.create({
      userId,
      homeAdType: "HomeLandText",
      homeLandAdId: homeLandTextAds._id,
      jobAdType: null, // Adjust as per your logic
      job_ads: null,
      generale_ads: null,
    });

    // Step 4: Respond with both created ads
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { homeLandTextAds, serviceAd },
          "Ad created successfully"
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

// Get all HomeText ads
export const getAllHomeLandTextAds = async (req, res, next) => {
  try {
    const homeLandTextAds = await HomeLandText.find();
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandTextAds,
          "Fetched all ads successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};

// Get HomeText ads by userId
export const getHomeLandTextAdsByUserId = async (req, res, next) => {
  const { userId } = req.params;
  try {
    // Step 1: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Fetch HomeText ads for the user
    const homeLandTextAds = await HomeLandText.find({ userId });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandTextAds,
          `Fetched ads for userId: ${userId}`
        )
      );
  } catch (error) {
    next(error);
  }
};

// Get HomeLandText ads by userId and category (Home/Land)
export const getHomeLandTextAdsByUserIdAndCategory = async (req, res, next) => {
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

    // Step 3: Fetch the HomeLandText ads for that user and category
    const homeLandTextAds = await HomeLandText.find({
      userId,
      category,
    });

    // Step 4: Check if any ads are found
    if (homeLandTextAds.length === 0) {
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
          homeLandTextAds,
          `Fetched ads for userId: ${userId} and category: ${category}`
        )
      );
  } catch (error) {
    next(error);
  }
};

// Update HomeText ad by userId
export const updateHomeLandTextAdByUserId = async (req, res, next) => {
  const { userId } = req.params;
  const updateData = req.body;

  try {
    // Step 1: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Update the HomeText ad
    const homeLandTextAd = await HomeLandText.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true } // Return the updated document and validate the update
    );

    if (!homeLandTextAd) {
      return res
        .status(404)
        .json(
          new ApiResponse(
            404,
            null,
            `No ads found for userId: ${userId}`
          )
        );
    }

    // Optionally update ServiceAds if relevant
    if (updateData.homeAdType || updateData.homeLandAdId) {
      await ServiceAds.updateOne(
        { userId, homeLandAdId: homeLandTextAd._id },
        { homeAdType: "HomeLandText", homeLandAdId: homeLandTextAd._id }
      );
    }

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandTextAd,
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

// Delete HomeText ad by userId
export const deleteHomeLandTextAdByUserId = async (req, res, next) => {
  const { userId } = req.params;

  try {
    // Step 1: Find the user by userId
    const user = await User.findById(userId); // Find the user from the User collection
    if (!user) {
      return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    // Step 2: Delete the HomeText ad
    const homeLandTextAd = await HomeLandText.findOneAndDelete({ userId });

    if (!homeLandTextAd) {
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

    // Step 3: Delete associated ServiceAds
    await ServiceAds.deleteOne({ userId, homeLandAdId: homeLandTextAd._id });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          homeLandTextAd,
          "Ad deleted successfully"
        )
      );
  } catch (error) {
    next(error);
  }
};
