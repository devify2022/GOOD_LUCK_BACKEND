import { Server } from "socket.io";
import { Chat } from "./models/dating/chatModel.js";
import { Dating } from "./models/dating/dating.model.js";
import mongoose from "mongoose";
import { MatchedProfileDating } from "./models/dating/matchedProfileDating.model.js";

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // Allow requests from this origin
      methods: ["GET", "POST"], // Allow these methods
      credentials: true, // Allow credentials (cookies, etc.)
    },
  });

  const activeUsers = new Map(); // Map to track active users and their socket IDs

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // Store user ID and socket ID on connection
    socket.on("register_user", async (userId) => {
      // Update the socketId for the user in the database
      try {
        const user = await Dating.findOneAndUpdate(
          { userId },
          { socketId: socket.id }, // Update the socketId
          { new: true }
        );

        if (!user) {
          return socket.emit("error", { message: "User not found." });
        }

        activeUsers.set(userId, socket.id);
        console.log(`User registered: ${userId} with socket ID: ${socket.id}`);
      } catch (error) {
        console.error("Error updating socketId:", error);
        socket.emit("error", { message: "Error registering user." });
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
