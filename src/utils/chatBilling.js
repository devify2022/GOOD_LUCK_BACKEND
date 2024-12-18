import { Astrologer } from "../models/astrologer/astroler.model.js";
import { Wallet } from "../models/wallet/wallet.model.js";

// Global intervals object to keep track of active intervals
const intervals = {};

// Start chat billing
export function startChat(io, roomId, chatType, userId, astrologerId) {
  const chatPrice = getChatPrice(chatType, astrologerId); // Replace with logic to fetch the astrologer's price for the chat type

  const interval = setInterval(async () => {
    const costPerMinute = chatPrice;

    const userWallet = await Wallet.findOne({
      ownerId: userId,
      ownerModel: "User",
    });
    const astrologerWallet = await Wallet.findOne({
      ownerId: astrologerId,
      ownerModel: "Astrologer",
    });
    const adminWallet = await Wallet.findOne({ ownerModel: "Admin" });

    if (userWallet.balance < costPerMinute) {
      io.to(roomId).emit("chat-end", { reason: "Insufficient funds" });
      clearInterval(interval);
      delete intervals[roomId];
      return;
    }

    // Deduct from user wallet
    userWallet.balance -= costPerMinute;
    userWallet.transactionHistory.push({
      type: "debit",
      amount: costPerMinute,
      description: "Chat cost",
    });
    await userWallet.save();

    // Credit to astrologer and admin
    const astrologerShare = (30 / 100) * costPerMinute;
    const adminShare = (70 / 100) * costPerMinute;

    astrologerWallet.balance += astrologerShare;
    astrologerWallet.transactionHistory.push({
      type: "credit",
      amount: astrologerShare,
      description: "Chat earnings",
    });
    await astrologerWallet.save();

    adminWallet.balance += adminShare;
    adminWallet.transactionHistory.push({
      type: "credit",
      amount: adminShare,
      description: "Chat commission",
    });
    await adminWallet.save();

    io.to(roomId).emit("chat-timer", { roomId, cost: costPerMinute });
  }, 60000); // 1 minute interval

  intervals[roomId] = interval; // Track the interval
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
    // Fetch the astrologer details from the database
    const astrologer = await Astrologer.findById(astrologerId);

    if (!astrologer) {
      throw new Error("Astrologer not found");
    }

    // Determine the price based on chat type (could be chat, video, or call)
    let price;
    switch (chatType) {
      case "chat":
        price = astrologer.chat_price;
        break;
      case "video":
        price = astrologer.video_price;
        break;
      case "call":
        price = astrologer.call_price;
        break;
      default:
        throw new Error("Invalid chat type");
    }

    return price;
  } catch (error) {
    console.error("Error fetching chat price:", error);
    throw new Error("Could not retrieve chat price");
  }
}
