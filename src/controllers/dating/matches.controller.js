import { Dating } from "../../models/dating/dating.model.js";
import { MatchedProfileDating } from "../../models/dating/matchedProfileDating.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

export const getMatchesByUserId = asyncHandler(async (req, res) => {
  const { userId } = req.params; // Extract userId from request params

  // Validate that userId is provided
  if (!userId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "User ID is required"));
  }

  // Fetch matched profiles where userId is either user1 or user2
  const matches = await MatchedProfileDating.find({
    $or: [{ user1: userId }, { user2: userId }],
    isActive: true, // Ensure the match is active
  }).exec();

  if (!matches || matches.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "No matches found for this user"));
  }

  // Fetch data from Dating collection for each user1 and user2
  const matchData = await Promise.all(
    matches.map(async (match) => {
      const user1Data = await Dating.findOne({ userId: match.user1 }).select(
        "Fname Lname photos city state bio interests"
      );
      const user2Data = await Dating.findOne({ userId: match.user2 }).select(
        "Fname Lname photos city state bio interests"
      );

      return {
        matchId: match._id,
        matchDate: match.matchDate,
        isActive: match.isActive,
        matchedUser1: user1Data || {},
        matchedUser2: user2Data || {},
      };
    })
  );

  // Return matches with populated user details in the response
  return res
    .status(200)
    .json(new ApiResponse(200, matchData, "Matches retrieved successfully"));
});
