import { Astrologer } from "../../../models/astrologer/astroler.model.js";
import { User } from "../../../models/auth/user.model.js";
import { ChatRequest } from "../../../models/chatRequest/chatRequest.model.js";
import { AstrologerChat } from "../../../models/chatWithAstrologer/astrologerChat.model.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { endChat, getChatPrice, startChat } from "./chatBilling.js";

// Function to handle chat requests
export async function handleChatRequest(io, data, socket) {
  try {
    const { userId, astrologerId, chatType } = data;

    // Retrieve the astrologer's details to get the socket ID and status
    const astrologer = await Astrologer.findById(astrologerId);
    if (!astrologer) {
      return socket.emit("error", { message: "Astrologer not found." });
    }

    // Check if the astrologer is busy or offline
    if (astrologer.status === "busy") {
      return socket.emit("error", {
        message: "Astrologer is currently busy.",
      });
    }

    if (!astrologer.socketId) {
      return socket.emit("error", { message: "Astrologer is not online." });
    }

    // Retrieve the user's wallet details to check balance
    const user = await User.findById(userId);
    if (!user) {
      return socket.emit("error", { message: "User not found." });
    }

    // Get the chat price for the requested chat type
    const costPerMinute = await getChatPrice(chatType, astrologerId);

    // Check if the user has sufficient funds
    if (user.wallet.balance < costPerMinute) {
      return io
        .to(user.socketId)
        .emit("chat-error", { message: "Insufficient funds." });
    }

    // Save the chat request in the database
    const chatRequest = new ChatRequest({ userId, astrologerId, chatType });
    await chatRequest.save();

    // Notify the astrologer about the incoming chat request using their socket ID
    io.to(astrologer.socketId).emit("chat-request", {
      requestId: chatRequest._id,
      userId,
      chatType,
    });

    console.log(
      `Chat request sent to astrologer: ${astrologerId}, Socket ID: ${astrologer.socketId}`
    );
  } catch (error) {
    console.error("Error handling chat request:", error);
    socket.emit("error", { message: "Error processing chat request." });
  }
}

// Function to handle astrologer's response to a chat request
export async function handleChatResponse(io, data) {
  try {
    const { requestId, response } = data;

    // Update chat request status in the database
    const chatRequest = await ChatRequest.findById(requestId);
    if (!chatRequest) {
      io.emit("error", { message: "Chat request not found" });
      return;
    }

    chatRequest.status = response;
    await chatRequest.save();

    if (response === "accepted") {
      const roomId = `room_${chatRequest.userId}_${chatRequest.astrologerId}`;
      chatRequest.roomId = roomId;
      await chatRequest.save();

      // Update the astrologer's status to "busy"
      const astrologer = await Astrologer.findById(chatRequest.astrologerId);
      astrologer.status = "busy";
      await astrologer.save();

      // Find the user and astrologer by their IDs to get the socketIds
      const user = await User.findById(chatRequest.userId);
      const astrologerUser = await Astrologer.findById(
        chatRequest.astrologerId
      );

      if (!user || !astrologerUser) {
        return io.emit("error", { message: "User or astrologer not found" });
      }

      // Get the socket IDs from the user and astrologer
      const userSocketId = user.socketId;
      const astrologerSocketId = astrologerUser.socketId;

      if (userSocketId) {
        // Notify the user about chat acceptance
        io.to(userSocketId).emit("chat-accepted", { roomId });
      } else {
        console.error("User is not online");
      }

      if (astrologerSocketId) {
        // Notify the astrologer about chat acceptance
        io.to(astrologerSocketId).emit("chat-accepted", { roomId });
      } else {
        console.error("Astrologer is not online");
      }

      // Start the chat billing process
      startChat(
        io,
        roomId,
        chatRequest.chatType,
        chatRequest.userId,
        chatRequest.astrologerId
      );
    } else {
      // Handle rejection logic
      const user = await User.findById(chatRequest.userId);
      if (user && user.socketId) {
        // Notify the user about the rejection
        io.to(user.socketId).emit("chat-rejected");
      } else {
        console.error("User is not online or socket ID not found");
      }
    }
  } catch (error) {
    console.error("Error handling chat response:", error);
  }
}

// Function to handle saving and broadcasting chat messages
export const handleChatMessage = async (data, io) => {
  const { roomId, message, senderId, senderModel, duration } = data;

  // Validate senderModel
  if (!["User", "Astrologer"].includes(senderModel)) {
    return { error: "Invalid sender model" };
  }

  try {
    // Find or create the chat room
    let chat = await AstrologerChat.findOne({ roomId });

    if (!chat) {
      chat = new AstrologerChat({ roomId, messages: [], duration });
    }

    // Add the new message to the messages array
    const newMessage = {
      senderId,
      senderModel,
      message,
    };
    chat.messages.push(newMessage);

    // Save the updated chat document
    await chat.save();

    // Broadcast the message to the chat room
    io.to(roomId).emit("received-message", {
      senderId,
      senderModel,
      message,
      timestamp: newMessage.timestamp,
      duration,
    });
    console.log("Message broadcasted to room:", roomId);

    return { success: true, timestamp: newMessage.timestamp };
  } catch (error) {
    console.error("Error saving message:", error);
    return { error: "Could not save message" };
  }
};

// Function to handle the end of the chat and update the astrologer's status
export async function handleEndChat(io, roomId, sender) {
  try {
    // End the chat and stop the timer, passing the sender information to determine the reason
    endChat(io, roomId, sender);

    // Find the chat request based on the roomId
    const chatRequest = await ChatRequest.findOne({ roomId });
    if (!chatRequest) {
      console.error("Chat request not found for roomId:", roomId);
      return;
    }

    // Find the astrologer based on the chat request
    const astrologer = await Astrologer.findById(chatRequest.astrologerId);
    if (!astrologer) {
      console.error("Astrologer not found:", chatRequest.astrologerId);
      return;
    }

    // Update the astrologer's status to 'available'
    astrologer.status = "available";
    await astrologer.save();

    console.log("Astrologer's status updated to available:", astrologer._id);
  } catch (error) {
    console.error("Error handling end of chat:", error);
  }
}

// Get chat history by user ID and astrologer ID
export const getAstrologerChatHistory = asyncHandler(async (req, res) => {
  const { userId, astrologerId } = req.params;

  // Find chat history where the userId and astrologerId match
  const chatHistory = await AstrologerChat.find({
    $or: [
      { "messages.senderId": userId, "messages.senderModel": "User" },
      {
        "messages.senderId": astrologerId,
        "messages.senderModel": "Astrologer",
      },
    ],
  });

  if (!chatHistory || chatHistory.length === 0) {
    return res
      .status(404)
      .json(
        new ApiResponse(
          404,
          null,
          "No chat history found for the user and astrologer"
        )
      );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, chatHistory, "Chat history retrieved successfully")
    );
});
