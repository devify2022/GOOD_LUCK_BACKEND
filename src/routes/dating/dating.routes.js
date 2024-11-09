import { Router } from "express";
import {
  createDatingProfile,
  deleteDatingProfileByUserId,
  getAllDatingProfiles,
  getDatingProfileByUserId,
  getPendingLikesProfilesDating,
  getSentLikesProfilesDating,
  sendLikeDating,
  updateDatingProfileByUserId,
} from "../../controllers/dating/dating.controller.js";

const router = Router();

router.route("/createDatingProfile/:id").post(createDatingProfile);
router.route("/").get(getAllDatingProfiles);
router.route("/:id").get(getDatingProfileByUserId);
router.route("/update/:id").patch(updateDatingProfileByUserId);
router.post("/send_like/:senderId/:receiverId", sendLikeDating);
router.get("/get/pending_like/:userId", getPendingLikesProfilesDating);
router.get("/get/sent_like/:userId", getSentLikesProfilesDating);
router.route("/delete/:id").delete(deleteDatingProfileByUserId);

export default router;
