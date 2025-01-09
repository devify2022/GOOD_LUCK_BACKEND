import { Router } from "express";
import { createAdSubscription } from "../../controllers/subscriptions/adSubcriptionController.js";

const router = Router();

router.route("/create").post(createAdSubscription);

export default router;
