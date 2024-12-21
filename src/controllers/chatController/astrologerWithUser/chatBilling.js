import { Admin } from "../../../models/admin/admin.model.js";
import { Astrologer } from "../../../models/astrologer/astroler.model.js";
import { User } from "../../../models/auth/user.model.js";

// Global intervals object to keep track of active intervals
const intervals = {};

// Start chat billing
export async function startChat(io, roomId, chatType, userId, astrologerId) {
  try {
    const astrologer = await Astrologer.findById(astrologerId);

    if (!astrologer) {
      io.to(roomId).emit("chat-error", { message: "Astrologer not found" });
      return;
    }

    const costPerMinute = await getChatPrice(chatType, astrologerId);

    const user = await User.findById(userId);
    const admin = await Admin.findOne(); // Assuming a single admin for simplicity

    if (!user || !admin) {
      io.to(roomId).emit("chat-error", { message: "User or Admin not found" });
      return;
    }

    const interval = setInterval(async () => {
      // Fetch wallet balances
      const userWallet = user.wallet;
      const astrologerWallet = astrologer.wallet;
      const adminWallet = admin.wallet;

      if (userWallet.balance < costPerMinute) {
        io.to(roomId).emit("chat-end", { reason: "Insufficient funds" });
        clearInterval(interval);
        delete intervals[roomId];
        return;
      }

      // Deduct from user wallet
      user.wallet.balance -= costPerMinute;
      const userTransaction = {
        timestamp: new Date(),
        type: "debit",
        amount: costPerMinute,
        description: `Chat session (${chatType}) with Astrologer ID: ${astrologerId}`,
        reference: `ChatRoom-${roomId}`,
      };
      user.wallet.transactionHistory.push(userTransaction);
      await user.save();

      // Calculate shares
      const astrologerShare = (30 / 100) * costPerMinute;
      const adminShare = (70 / 100) * costPerMinute;

      // Credit to astrologer
      astrologer.wallet.balance += astrologerShare;
      const astrologerTransaction = {
        timestamp: new Date(),
        type: "credit",
        amount: astrologerShare,
        description: "Chat earnings",
        reference: `ChatRoom-${roomId}`,
      };
      astrologer.wallet.transactionHistory.push(astrologerTransaction);
      await astrologer.save();

      // Credit to admin
      admin.wallet.balance += adminShare;
      const adminTransaction = {
        timestamp: new Date(),
        type: "credit",
        amount: adminShare,
        description: "Chat commission",
        reference: `ChatRoom-${roomId}`,
      };
      admin.wallet.transactionHistory.push(adminTransaction);
      await admin.save();

      // Emit updates to the room
      io.to(roomId).emit("chat-timer", { roomId, cost: costPerMinute });
    }, 60000); // 1-minute interval

    intervals[roomId] = interval; // Track the interval
  } catch (error) {
    console.error("Error in startChat:", error);
    io.to(roomId).emit("chat-error", {
      message: "An error occurred during chat billing",
    });
  }
}

// End chat billing
export function endChat(io, roomId) {
  if (intervals[roomId]) {
    clearInterval(intervals[roomId]); // Stop the timer
    delete intervals[roomId];
  }
  io.to(roomId).emit("chat-end", {
    reason: "Chat ended by user or astrologer",
  });
}

// Utility function to get chat price
async function getChatPrice(chatType, astrologerId) {
  try {
    const astrologer = await Astrologer.findById(astrologerId);

    if (!astrologer) {
      throw new Error("Astrologer not found");
    }

    // Determine the price based on chat type
    switch (chatType) {
      case "chat":
        return astrologer.chat_price;
      case "video":
        return astrologer.video_price;
      case "call":
        return astrologer.call_price;
      default:
        throw new Error("Invalid chat type");
    }
  } catch (error) {
    console.error("Error fetching chat price:", error);
    throw new Error("Could not retrieve chat price");
  }
}
