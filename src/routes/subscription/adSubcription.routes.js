import { Router } from "express";
import { createAdSubscription, deleteAdSubscription, getAdSubscription, updateAdSubscriptions } from "../../controllers/subscriptions/adSubcriptionController.js";

const router = Router();

router.route("/create").post(createAdSubscription);
router.route("/get").get(getAdSubscription);
router.route("/update").patch(updateAdSubscriptions);
router.route("/delete/:subscriptionId").delete(deleteAdSubscription);

export default router;
