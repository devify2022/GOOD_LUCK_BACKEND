import { Astrologer } from "../../../models/astrologer/astroler.model.js";
import { User } from "../../../models/auth/user.model.js";
import { ChatRequest } from "../../../models/chatRequest/chatRequest.model.js";
import { AstrologerChat } from "../../../models/chatWithAstrologer/astrologerChat.model.js";
import { ApiResponse } from "../../../utils/apiResponse.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import {
  endCall,
  endChat,
  getChatPrice,
  pauseChat,
  resumeChat,
  startCall,
  startChat,
} from "./chatBilling.js";
import AgoraAccessToken from "agora-access-token";

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
    console.log(
      `Notifying astrologer ${astrologer.socketId} about incoming chat request from user ${userId}`
    );
    io.to(astrologer.socketId).emit("chat-request-from-user", {
      requestId: chatRequest._id,
      userId,
      chatType,
    });

    // // Notify the astrologer about the incoming chat request using their socket ID
    // io.to(astrologer.socketId).emit("chat-request-from-user", {
    //   requestId: chatRequest._id,
    //   userId,
    //   chatType,
    // });

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

// Function to handle pausing the chat
export async function handlePauseChat(io, data) {
  const { roomId } = data;

  try {
    pauseChat(io, roomId);
  } catch (error) {
    console.error("Error pausing chat:", error);
    io.to(roomId).emit("chat-error", { message: "Error pausing chat." });
  }
}

// Function to handle resuming the chat
export async function handleResumeChat(io, data) {
  const { roomId, chatType, userId, astrologerId } = data;

  try {
    resumeChat(io, roomId, chatType, userId, astrologerId);
  } catch (error) {
    console.error("Error resuming chat:", error);
    io.to(roomId).emit("chat-error", { message: "Error resuming chat." });
  }
}

// Function to handle call requests
export async function handleCallRequest(io, data, socket) {
  try {
    const { userId, astrologerId, callType, channelId } = data;

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

    // Get the call price for the requested call type
    const costPerMinute = await getChatPrice(callType, astrologerId);

    // Check if the user has sufficient funds
    if (user.wallet.balance < costPerMinute) {
      return io
        .to(user.socketId)
        .emit("call-error", { message: "Insufficient funds." });
    }

    // Save the call request in the database
    const callRequest = new ChatRequest({ userId, astrologerId, callType });
    await callRequest.save();

    // Agora credentials
    const appID = "69779ffdb88442ecb348ae75b0b3963d";
    const appCertificate = "e10b414d78c84ec9bcd1160d6fe0ef4c";

    // Generate unique UIDs for both client and astrologer
    const userUid = Math.floor(Math.random() * 100000); // Unique UID for the client
    const astrologerUid = Math.floor(Math.random() * 100000); // Unique UID for the astrologer

    // Function to generate Agora token
    const generateAgoraToken = (
      channelName,
      appID,
      appCertificate,
      uid,
      role
    ) => {
      return AgoraAccessToken.RtcTokenBuilder.buildTokenWithUid(
        appID,
        appCertificate,
        channelName,
        uid,
        role,
        Math.floor(Date.now() / 1000) + 3600 // Token expires in 1 hour
      );
    };

    // Define the channel name from the passed `channelId`
    const channelName = channelId;

    // Generate tokens for both client (PUBLISHER) and astrologer (PUBLISHER)
    const clientToken = generateAgoraToken(
      channelName,
      appID,
      appCertificate,
      userUid,
      AgoraAccessToken.RtcRole.PUBLISHER
    );
    const astrologerToken = generateAgoraToken(
      channelName,
      appID,
      appCertificate,
      astrologerUid,
      AgoraAccessToken.RtcRole.PUBLISHER
    );

    // Notify the astrologer about the incoming call request
    io.to(astrologer.socketId).emit("call-request-from-user", {
      requestId: callRequest._id,
      userId,
      callType,
      channelName,
      userUid,
      astrologerUid,
      clientToken,
      astrologerToken,
    });

    console.log(
      `Call request sent to astrologer: ${astrologerId}, Socket ID: ${astrologer.socketId}`
    );

    // Notify the user with the call details and tokens
    io.to(user.socketId).emit("call-details", {
      requestId: callRequest._id,
      astrologerId,
      callType,
      channelName,
      userUid,
      astrologerUid,
      clientToken,
      astrologerToken,
    });
  } catch (error) {
    console.error("Error handling call request:", error);
    socket.emit("error", { message: "Error processing call request." });
  }
}

// Function to handle astrologer's response to a call request
export async function handleCallResponse(io, data) {
  try {
    const { requestId, response, userId, astrologerId, callType } = data;

    // Retrieve the call request from the database
    const callRequest = await ChatRequest.findById(requestId);
    if (!callRequest) {
      return io.emit("error", { message: "Call request not found" });
    }

    // Update the call request status
    callRequest.status = response;
    await callRequest.save();

    // Handle astrologer acceptance
    if (response === "accepted") {
      const roomId = `room_${callRequest.userId}_${callRequest.astrologerId}`;
      callRequest.roomId = roomId;
      console.log("Astrologer accepted the call. Preparing to start...");

      // Retrieve the astrologer and user
      const astrologer = await Astrologer.findById(astrologerId);
      const user = await User.findById(userId);

      if (!astrologer || !user) {
        return io.emit("error", { message: "User or astrologer not found" });
      }

      // Get socket IDs from the user and astrologer
      const userSocketId = user.socketId;
      const astrologerSocketId = astrologer.socketId;

      // Notify astrologer and user that the call has started
      if (astrologerSocketId) {
        io.to(astrologerSocketId).emit("callid_audiocall", {
          roomId,
          message:
            "Call started successfully. You are now connected with the user.",
        });
      } else {
        console.error("Astrologer is not online.");
      }

      if (userSocketId) {
        io.to(userSocketId).emit("callid_audiocall", {
          roomId,
          message: "Astrologer has joined the call.",
        });
      } else {
        console.error("User is not online.");
      }

      // Start the call billing process
      await startCall(io, roomId, callType, userId, astrologerId);
    }
    // Handle astrologer rejection
    else if (response === "rejected") {
      console.log("Astrologer rejected the call.");

      const user = await User.findById(callRequest.userId);
      if (user && user.socketId) {
        io.to(user.socketId).emit("call-rejected", {
          message: "Astrologer rejected the call.",
        });
      } else {
        console.error("User is not online or socket ID not found.");
      }
    }
  } catch (error) {
    console.error("Error handling call response:", error);
    io.emit("error", { message: "Error handling call response." });
  }
}

// Function to handle the end of the call and update the astrologer's status
export async function handleEndCall(io, roomId, sender) {
  try {
    // End the call and stop the timer, passing the sender information to determine the reason
    endCall(io, roomId, sender);

    // Find the call request based on the roomId
    const callRequest = await ChatRequest.findOne({ roomId });
    if (!callRequest) {
      console.error("Call request not found for roomId:", roomId);
      return;
    }

    // Find the astrologer based on the call request
    const astrologer = await Astrologer.findById(callRequest.astrologerId);
    if (!astrologer) {
      console.error("Astrologer not found:", callRequest.astrologerId);
      return;
    }

    // Update the astrologer's status to 'available'
    astrologer.status = "available";
    await astrologer.save();

    console.log("Astrologer's status updated to available:", astrologer._id);
  } catch (error) {
    console.error("Error handling end of call:", error);
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

// Get astrologers chat list for a user
export const getChatListForUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "User ID is required."));
  }

  try {
    // Find all chats where the user is involved
    const chats = await AstrologerChat.find({
      "messages.senderId": userId,
      "messages.senderModel": "User",
    }).populate("messages.receiverId", "name profilePicture");

    if (!chats || chats.length === 0) {
      return res
        .status(404)
        .json(
          new ApiResponse(404, null, "No chat history found for the user.")
        );
    }

    // Extract distinct astrologer IDs
    const astrologerIds = [
      ...new Set(
        chats.map(
          (chat) =>
            chat.messages.find(
              (message) => message.senderModel === "Astrologer"
            )?.senderId
        )
      ),
    ];

    // Fetch astrologers' details
    const astrologers = await Astrologer.find({
      _id: { $in: astrologerIds },
    }).select("name profilePicture");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          astrologers,
          "List of astrologers the user has chatted with retrieved successfully."
        )
      );
  } catch (error) {
    res.status(500).json(new ApiResponse(500, null, error.message));
  }
});


// Get users chat list for an astrologer
export const getChatListForAstrologer = asyncHandler(async (req, res) => {
  const { astrologerId } = req.params;

  if (!astrologerId) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Astrologer ID is required."));
  }

  try {
    // Find all chats where the astrologer is involved
    const chats = await AstrologerChat.find({
      "messages.senderId": astrologerId,
      "messages.senderModel": "Astrologer",
    }).populate("messages.receiverId", "name profilePicture");

    if (!chats || chats.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, null, "No chat history found for the astrologer."));
    }

    // Extract distinct user IDs
    const userIds = [
      ...new Set(
        chats.map((chat) =>
          chat.messages.find((message) => message.senderModel === "User")?.senderId
        )
      ),
    ];

    // Fetch users' details
    const users = await User.find({
      _id: { $in: userIds },
    }).select("name profilePicture");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          users,
          "List of users the astrologer has chatted with retrieved successfully."
        )
      );
  } catch (error) {
    res.status(500).json(new ApiResponse(500, null, error.message));
  }
});
