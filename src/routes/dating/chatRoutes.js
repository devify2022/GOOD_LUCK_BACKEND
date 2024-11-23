import express from "express";
import { createChatForMatch } from "../../controllers/dating/chatController.js";

const router = express.Router();

router.post("/create", createChatForMatch);

export default router;
