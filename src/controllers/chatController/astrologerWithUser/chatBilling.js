import { Admin } from "../../../models/admin/admin.model.js";
import { Astrologer } from "../../../models/astrologer/astroler.model.js";
import { User } from "../../../models/auth/user.model.js";
import { generateTransactionId } from "../../../utils/generateTNX.js";

// Global intervals object to keep track of active intervals
const intervals = {};

async function deductUserWallet(
  user,
  costPerMinute,
  roomId,
  chatType,
  astrologerId
) {
  if (user.wallet.balance < costPerMinute) {
    return { success: false, message: "Insufficient funds" };
  }

  // Generate a transaction ID
  const transactionId = generateTransactionId();

  user.wallet.balance -= costPerMinute;
  const transaction = {
    timestamp: new Date(),
    type: "debit",
    debit_type: "chat",
    amount: costPerMinute,
    description: `Chat session (${chatType}) with Astrologer ID: ${astrologerId}`,
    reference: `ChatRoom-${roomId}`,
    transactionId: transactionId,
  };
  user.wallet.transactionHistory.push(transaction);
  await user.save();

  return { success: true };
}

// Function to update astrologer and admin wallets
async function creditAstrologerAndAdmin(astrologer, admin, totalCost, roomId) {
  const transactionId = generateTransactionId();

  const astrologerShare = (60 / 100) * totalCost;
  const adminShare = (40 / 100) * totalCost;

  astrologer.wallet.balance += astrologerShare;
  astrologer.total_earning += astrologerShare;
  astrologer.wallet.transactionHistory.push({
    timestamp: new Date(),
    type: "credit",
    credit_type: "chat",
    amount: astrologerShare,
    description: "Chat earnings",
    reference: `ChatRoom-${roomId}`,
    transactionId: transactionId,
  });
  await astrologer.save();

  admin.wallet.balance += adminShare;
  admin.wallet.transactionHistory.push({
    timestamp: new Date(),
    type: "credit",
    credit_type: "chat",
    amount: adminShare,
    description: "Chat commission",
    reference: `ChatRoom-${roomId}`,
  });
  await admin.save();
}

export async function startChat(io, roomId, chatType, userId, astrologerId) {
  try {
    const astrologer = await Astrologer.findById(astrologerId);
    const user = await User.findById(userId);
    const admin = await Admin.findOne();

    if (!astrologer || !user || !admin) {
      io.to(roomId).emit("chat-error", {
        message: "Astrologer, User, or Admin not found",
      });
      return;
    }

    const costPerMinute = await getChatPrice(chatType, astrologerId);

    const firstDeduction = await deductUserWallet(
      user,
      costPerMinute,
      roomId,
      chatType,
      astrologerId
    );

    if (!firstDeduction.success) {
      io.to(roomId).emit("chat-error", {
        message: firstDeduction.message,
      });
      io.to(roomId).emit("chat-end", { reason: firstDeduction.message });

      astrologer.status = "available";
      await astrologer.save();
      return;
    }

    await creditAstrologerAndAdmin(astrologer, admin, costPerMinute, roomId);

    let totalTime = 1;

    const interval = setInterval(async () => {
      try {
        const deductionResult = await deductUserWallet(
          user,
          costPerMinute,
          roomId,
          chatType,
          astrologerId
        );

        if (!deductionResult.success) {
          io.to(roomId).emit("chat-error", {
            message: deductionResult.message,
          });
          io.to(roomId).emit("chat-end", { reason: deductionResult.message });

          astrologer.status = "available";
          await astrologer.save();
          clearInterval(interval);
          delete intervals[roomId];
          return;
        }

        await creditAstrologerAndAdmin(
          astrologer,
          admin,
          costPerMinute,
          roomId
        );

        totalTime++;
        io.to(roomId).emit("chat-timer", {
          roomId,
          cost: costPerMinute,
          elapsedTime: totalTime,
        });
      } catch (error) {
        console.error("Error during interval execution:", error);
        io.to(roomId).emit("chat-error", {
          message: "An error occurred during chat billing",
        });
        clearInterval(interval);
        delete intervals[roomId];
      }
    }, 60000);

    intervals[roomId] = interval;
  } catch (error) {
    console.error("Error in startChat:", error);
    io.to(roomId).emit("chat-error", {
      message: "An error occurred during chat initialization",
    });
  }
}

// End chat billing
export function endChat(io, roomId, sender) {
  if (intervals[roomId]) {
    clearInterval(intervals[roomId]); // Stop the timer
    delete intervals[roomId];
  }

  // Emit a notification to both user and astrologer
  io.to(roomId).emit("chat-end", {
    reason:
      sender === "user" ? "Chat ended by user" : "Chat ended by astrologer",
  });
}

// Utility function to get chat price
export async function getChatPrice(chatType, astrologerId) {
  try {
    const astrologer = await Astrologer.findById(astrologerId);

    if (!astrologer) {
      throw new Error("Astrologer not found");
    }

    // Determine the price based on chat type
    switch (chatType) {
      case "text":
        return astrologer.chat_price;
      case "video":
        return astrologer.video_price;
      case "audio":
        return astrologer.call_price;
      default:
        throw new Error("Invalid chat type");
    }
  } catch (error) {
    console.error("Error fetching chat price:", error);
    throw new Error("Could not retrieve chat price");
  }
}
