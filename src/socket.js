import { Server } from "socket.io";
import { Chat } from "./models/dating/chatModel.js";
import { Dating } from "./models/dating/dating.model.js";
import mongoose from "mongoose";
import { MatchedProfileDating } from "./models/dating/matchedProfileDating.model.js";
import { User } from "./models/auth/user.model.js";
import { Astrologer } from "./models/astrologer/astroler.model.js";
import { ChatRequest } from "./models/chatRequest/chatRequest.model.js";
import { endChat, startChat } from "./utils/chatBilling.js";

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://192.168.29.9:8081", // Allow requests from this origin
      methods: ["GET", "POST"], // Allow these methods
      credentials: true, // Allow credentials (cookies, etc.)
    },
  });

  const activeUsers = new Map(); // Map to track active users and their socket IDs

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Store user ID and socket ID on connection
    socket.on("register_user", async (userId) => {
      try {
        // First, check in the User model
        const user = await User.findOne({ _id: userId });

        if (user) {
          // Check if the user is not an astrologer, admin, or affiliate
          if (
            !user.isAstrologer &&
            !user.isAdmin &&
            !user.isAffiliate_marketer
          ) {
            user.socketId = socket.id; // Update socket ID
            await user.save(); // Save the user document
            activeUsers.set(userId, socket.id); // Track active users
            console.log(
              `User registered: ${userId} with socket ID: ${socket.id}`
            );
            return;
          } else {
            return socket.emit("error", {
              message: "User role not eligible for this action.",
            });
          }
        }

        // If not found in the User model, check in the Dating model
        const datingUser = await Dating.findOneAndUpdate(
          { userId },
          { socketId: socket.id }, // Update the socketId
          { new: true }
        );

        if (!datingUser) {
          return socket.emit("error", {
            message: "User not found in Dating model.",
          });
        }

        activeUsers.set(userId, socket.id); // Track active dating users
        console.log(
          `Dating user registered: ${userId} with socket ID: ${socket.id}`
        );
      } catch (error) {
        console.error("Error updating socketId:", error);
        socket.emit("error", { message: "Error registering user." });
      }
    });

    // Register astrologer and update socket ID
    socket.on("register_astrologer", async (userId) => {
      try {
        // Find the astrologer by userId
        const astrologer = await Astrologer.findOne({ userId });

        if (!astrologer) {
          return socket.emit("error", { message: "Astrologer not found." });
        }

        astrologer.socketId = socket.id; // Update socket ID
        await astrologer.save(); // Save the astrologer document
        activeUsers.set(userId, socket.id); // Track active astrologers
        console.log(
          `Astrologer registered: ${userId} with socket ID: ${socket.id}`
        );
      } catch (error) {
        console.error("Error updating astrologer's socketId:", error);
        socket.emit("error", { message: "Error registering astrologer." });
      }
    });

    // Handle sending messages
    socket.on("send_message", async (messageData) => {
      const { senderId, matchId, message } = messageData;

      try {
        // Convert IDs to ObjectId format
        const senderObjectId = new mongoose.Types.ObjectId(senderId);
        const matchObjectId = new mongoose.Types.ObjectId(matchId);

        // Fetch the chat by matchId
        const chat = await Chat.findOne({ matchId: matchObjectId });

        if (!chat) {
          // If no chat is found for this matchId, emit an error and return
          return socket.emit("error", {
            message: "Chat not found for this matchId.",
          });
        }

        // Add the new message to the chat
        const newMessage = {
          senderId: senderObjectId,
          message,
          timestamp: Date.now(),
        };

        chat.messages.push(newMessage); // Add message to the array
        await chat.save(); // Save the updated chat

        console.log("Message added to chat:", chat);

        const existingMatch = await MatchedProfileDating.findById(matchId);

        if (!existingMatch) {
          // If no match is found for this matchId, emit an error and return
          return socket.emit("error", {
            message: "Match not found for this matchId.",
          });
        }

        // Use $or to find users by user1 and user2
        const matchedUsers = await Dating.find({
          $or: [
            { userId: existingMatch.user1 },
            { userId: existingMatch.user2 },
          ],
        });

        if (!matchedUsers || matchedUsers.length === 0) {
          // Handle the case where no users are found
          return socket.emit("error", { message: "Matched users not found." });
        }

        // Notify both users (sender and receiver)
        matchedUsers.forEach((user) => {
          if (user.socketId) {
            const isSender = String(user.userId) === senderId;

            io.to(user.socketId).emit("new_message", {
              senderId,
              matchId,
              message,
              timestamp: newMessage.timestamp,
              fromSender: isSender, // Indicates whether the message is sent by this user
            });

            console.log(
              `Message sent to ${isSender ? "sender" : "receiver"}:`,
              user.userId
            );
          } else {
            console.log(
              `User ${user.userId} is offline or socketId is not available.`
            );
          }
        });
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Error sending message." });
      }
    });

    //================================= ASTROLOGER CHAT PART====================================
    // Handle chat request from user
    socket.on("chat-request", async (data) => {
      try {
        const { userId, astrologerId, chatType } = data;

        // Retrieve the astrologer's details to get the socket ID
        const astrologer = await Astrologer.findById(astrologerId);

        if (!astrologer) {
          return socket.emit("error", { message: "Astrologer not found." });
        }

        if (!astrologer.socketId) {
          return socket.emit("error", { message: "Astrologer is not online." });
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
    });

    // Handle astrologer's response
    socket.on("chat-response", async (data) => {
      try {
        const { requestId, response } = data;

        // Update chat request status in the database
        const chatRequest = await ChatRequest.findById(requestId);
        if (!chatRequest) {
          socket.emit("error", { message: "Chat request not found" });
          return;
        }

        chatRequest.status = response;
        await chatRequest.save();

        if (response === "accepted") {
          const roomId = `room_${chatRequest.userId}_${chatRequest.astrologerId}`;
          chatRequest.roomId = roomId;
          await chatRequest.save();

          // Find the user and astrologer by their IDs to get the socketIds
          const user = await User.findById(chatRequest.userId);
          const astrologer = await Astrologer.findById(
            chatRequest.astrologerId
          );

          if (!user || !astrologer) {
            return socket.emit("error", {
              message: "User or astrologer not found",
            });
          }

          // Get the socket IDs from the user and astrologer
          const userSocketId = user.socketId;
          const astrologerSocketId = astrologer.socketId;

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
          // Find the user to get the socketId for rejection notification
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
    });

    // Handle messages sent in the chat
    socket.on("chat-message", (data) => {
      const { roomId, message, senderId } = data;

      // Broadcast the message to the chat room
      io.to(roomId).emit("chat-message", { senderId, message });
    });

    // Handle chat termination
    socket.on("end-chat", (data) => {
      const { roomId } = data;

      // End the chat and stop the timer
      endChat(io, roomId);
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);

      // Remove the user from the active users map
      for (const [userId, socketId] of activeUsers.entries()) {
        if (socketId === socket.id) {
          activeUsers.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};
