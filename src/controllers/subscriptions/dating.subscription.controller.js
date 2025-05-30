import { DatingSubscription } from "../../models/subscription/dating.subscription.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// POST API to update one_year_plan and one_month_plan prices
export const createDatingSubscription = asyncHandler(async (req, res) => {
  const { one_month_plan, one_year_plan } = req.body;

  // Validate input
  if (one_month_plan === undefined && one_year_plan === undefined) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "At least one price is required"));
  }

  // Find the AdSubscription (assuming a single document in the collection)
  let subscription = await DatingSubscription.findOne();

  // If no AdSubscription exists, create a new one
  if (!subscription) {
    subscription = new DatingSubscription({});
  }

  // Update the prices
  if (one_month_plan !== undefined)
    subscription.one_month_plan = one_month_plan;
  if (one_year_plan !== undefined) subscription.one_year_plan = one_year_plan;

  // Save the updated subscription
  await subscription.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscription,
        "Subscription prices updated successfully"
      )
    );
});

// GET API to fetch dating subscription prices
export const getDatingSubscription = asyncHandler(async (req, res) => {
  // Find the DatingSubscription (assuming a single document in the collection)
  const subscription = await DatingSubscription.findOne();

  // Check if a subscription document exists
  if (!subscription) {
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Subscription not found"));
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      subscription,
      "Subscription prices fetched successfully"
    )
  );
});

// Function to update Ad subscription prices
export const updateDatingSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;
  const { one_month_plan, one_year_plan } = req.body;

  // Validate input
  if (!subscriptionId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Subscription ID is required"));
  }

  if (one_month_plan === undefined && one_year_plan === undefined) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "At least one price is required"));
  }

  // Prepare the update object
  const updateData = {};
  if (one_month_plan !== undefined) updateData.one_month_plan = one_month_plan;
  if (one_year_plan !== undefined) updateData.one_year_plan = one_year_plan;

  // Find the AdSubscription by ID and update it
  const subscription = await DatingSubscription.findByIdAndUpdate(
    subscriptionId,
    updateData,
    { new: true, runValidators: true }
  );

  if (!subscription) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Subscription not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscription,
        "Subscription prices updated successfully"
      )
    );
});

// Function to delete an Ad subscription
export const deleteDatingSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.params;

  // Validate input
  if (!subscriptionId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Subscription ID is required"));
  }

  // Find the AdSubscription by ID and delete it
  const subscription =
    await DatingSubscription.findByIdAndDelete(subscriptionId);

  if (!subscription) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Subscription not found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Subscription deleted successfully"));
});
