import { Router } from "express";
import { getAstrologerChatHistory } from "../../controllers/chatController/astrologerWithUser/controller.js";

const router = Router();

router.get('/chat-history/:userId/:astrologerId', getAstrologerChatHistory);

export default router;
