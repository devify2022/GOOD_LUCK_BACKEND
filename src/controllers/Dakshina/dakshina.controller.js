import { Dakshina } from "../../models/Dakshina/dakshina.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Create a new Dakshina
export const createDakshina = asyncHandler(async (req, res) => {
  const { image, god_name, day } = req.body;

  // Validate required fields
  if (!image || !god_name || !day) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "All fields are required"));
  }

  // Create a new Dakshina entry
  const dakshina = await Dakshina.create({ image, god_name, day });

  return res
    .status(201)
    .json(new ApiResponse(201, dakshina, "Dakshina created successfully"));
});

// Get all Dakshinas
export const getAllDakshinas = asyncHandler(async (req, res) => {
  const dakshinas = await Dakshina.find();
  return res
    .status(200)
    .json(
      new ApiResponse(200, dakshinas, "All Dakshinas retrieved successfully")
    );
});

// Get Dakshinas by day
export const getDakshinasByDay = asyncHandler(async (req, res) => {
  const { day } = req.params;

  // Validate day parameter
  if (
    ![
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ].includes(day)
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid day provided"));
  }

  const dakshinas = await Dakshina.find({ day });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        dakshinas,
        `Dakshinas for ${day} retrieved successfully`
      )
    );
});

// Update Dakshina by ID
export const updateDakshinaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate the ID
  const dakshina = await Dakshina.findById(id);
  if (!dakshina) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Dakshina not found"));
  }

  // Update only the fields provided in the request body
  Object.keys(req.body).forEach((key) => {
    dakshina[key] = req.body[key];
  });

  const updatedDakshina = await dakshina.save();
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedDakshina, "Dakshina updated successfully")
    );
});

// Delete Dakshina by ID
export const deleteDakshinaById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find and delete the Dakshina by ID
  const deletedDakshina = await Dakshina.findByIdAndDelete(id);

  if (!deletedDakshina) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Dakshina not found"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, deletedDakshina, "Dakshina deleted successfully")
    );
});
