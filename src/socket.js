import { Server } from "socket.io";
import { Chat } from "./models/dating/chatModel.js";
import { Dating } from "./models/dating/dating.model.js";
import mongoose from "mongoose";

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
      const { senderId, receiverId, message } = messageData;
      // console.log(messageData);

      try {
        // Cast the senderId and receiverId to ObjectId
        const senderObjectId = new mongoose.Types.ObjectId(senderId);
        const receiverObjectId = new mongoose.Types.ObjectId(receiverId);

        // Find the existing chat between the sender and receiver
        let chat = await Chat.findOne({
          matchId: { $all: [senderObjectId, receiverObjectId] }, // Use $all to check for both ObjectIds
        });

        // If no chat is found, create a new one
        if (!chat) {
          chat = new Chat({
            matchId: [senderObjectId, receiverObjectId], // Store ObjectId array
            messages: [
              {
                senderId: senderObjectId,
                message,
                timestamp: Date.now(),
              },
            ],
          });

          // Save the new chat document
          await chat.save();
          console.log("Created new chat:", chat);
        } else {
          // If a chat exists, just push the new message to the existing chat
          chat.messages.push({
            senderId: senderObjectId,
            message,
            timestamp: Date.now(),
          });

          await chat.save();
          console.log("Added message to existing chat:", chat);
        }

        // Emit the message to the receiver if online
        const receiver = await Dating.findOne({ userId: receiverId });
        if (receiver && receiver.socketId) {
          io.to(receiver.socketId).emit("new_message", {
            senderId: senderObjectId,
            message,
            timestamp: Date.now(),
          });
        } else {
          console.log(`Receiver not connected or socketId not found.`);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("error", { message: "Error sending message" });
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
