import { LocalService } from "../../models/local services/localservice.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Create a Local Service
export const createLocalService = asyncHandler(async (req, res, next) => {
  try {
    const { userId, authId, category, image, contact, isAvailable } = req.body;

    const missingFields = [];
    if (!userId) missingFields.push("userId");
    if (!authId) missingFields.push("authId");
    if (!category) missingFields.push("category");
    if (!image) missingFields.push("image");
    if (!contact) missingFields.push("contact");

    if (missingFields.length > 0) {
      return res
        .status(400)
        .json(
          new ApiResponse(
            400,
            null,
            `Missing required fields: ${missingFields.join(", ")}`
          )
        );
    }

    const newService = new LocalService({
      userId,
      authId,
      category,
      image,
      contact,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    });

    await newService.save();

    return res
      .status(201)
      .json(
        new ApiResponse(201, newService, "Local service created successfully")
      );
  } catch (error) {
    next(error);
  }
});

// Get All Local Services
export const getAllLocalServices = asyncHandler(async (req, res, next) => {
  try {
    const services = await LocalService.find().populate("category", "name");

    if (!services.length) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No local services found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, services, "Local services fetched successfully")
      );
  } catch (error) {
    next(error);
  }
});

// Get Local Service by ID
export const getLocalServiceById = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await LocalService.findById(id).populate(
      "category",
      "name"
    );

    if (!service) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Local service not found"));
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, service, "Local service fetched successfully")
      );
  } catch (error) {
    next(error);
  }
});

// Update Local Service by ID
export const updateLocalService = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, image, contact, isAvailable } = req.body;

    const existingService = await LocalService.findById(id);
    if (!existingService) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Local service not found"));
    }

    // Update fields if provided
    if (category) existingService.category = category;
    if (image) existingService.image = image;
    if (contact) existingService.contact = contact;
    if (isAvailable !== undefined) existingService.isAvailable = isAvailable;

    await existingService.save();

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          existingService,
          "Local service updated successfully"
        )
      );
  } catch (error) {
    next(error);
  }
});

// Delete Local Service by ID
export const deleteLocalService = asyncHandler(async (req, res, next) => {
  try {
    const { id } = req.params;
    const service = await LocalService.findByIdAndDelete(id);

    if (!service) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "Local service not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, null, "Local service deleted successfully"));
  } catch (error) {
    next(error);
  }
});
