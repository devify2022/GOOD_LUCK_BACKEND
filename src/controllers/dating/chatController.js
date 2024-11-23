import { Chat } from "../../models/dating/chatModel.js";
import { MatchedProfileDating } from "../../models/dating/matchedProfileDating.model.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// Function to create a chat for an already existing match
export const createChatForMatch = asyncHandler(async (req, res) => {
  const { user1, user2 } = req.body; // Extract user1 and user2 from request body

  // Check if both users are provided
  if (!user1 || !user2) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Both users are required"));
  }

  // Check if a match already exists between user1 and user2
  const existingMatch = await MatchedProfileDating.findOne({
    $or: [
      { user1: user1, user2: user2 },
      { user1: user2, user2: user1 },
    ],
  });

  if (!existingMatch) {
    return res.status(404).json(new ApiResponse(404, null, "Match not found"));
  }

  // Create a new chat document for the match
  const newChat = new Chat({
    matchId: existingMatch._id, // Set the matchId for the chat
    messages: [], // Initially no messages
  });

  // Save the new chat
  const savedChat = await newChat.save();

  // Update the match with the saved chatId
  existingMatch.chatId = savedChat._id;
  await existingMatch.save();

  // Return the updated match and chat details
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { match: existingMatch, chat: savedChat },
        "Chat created and linked to the match successfully"
      )
    );
});
