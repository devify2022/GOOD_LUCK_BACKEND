import { Router } from "express";
import { getAstrologerChatHistory, getChatListForUser } from "../../controllers/chatController/astrologerWithUser/controller.js";

const router = Router();

router.get('/chat-history/:userId/:astrologerId', getAstrologerChatHistory);
router.get('/chat-list/:userId', getChatListForUser);

export default router;
