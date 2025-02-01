import { Router } from "express";
import {
  createMatrimonyProfile,
  deleteMatrimonyProfileByUserId,
  getAllMatrimonyProfile,
  getMatrimonyProfileByUserId,
  getPendingLikesProfilesMatrimony,
  getRandomBrides,
  getRandomGrooms,
  getSentLikesProfilesMatrimony,
  sendLikeMatrimony,
  updateMatrimonyProfileByUserId,
} from "../../controllers/matrimony/matrimony.controller.js";

const router = Router();

router.route("/createMatrimonyProfile/:id").post(createMatrimonyProfile);
router.route("/getAll/:id").get(getAllMatrimonyProfile);
router.route("/brides/:userId").get(getRandomBrides);
router.route("/grooms/:userId").get(getRandomGrooms);
router.route("/:id").get(getMatrimonyProfileByUserId);
router.route("/update/:id").patch(updateMatrimonyProfileByUserId);
router.post("/send_like/:senderId/:receiverId", sendLikeMatrimony);
router.get("/get/pending_like/:userId", getPendingLikesProfilesMatrimony);
router.get("/get/sent_like/:userId", getSentLikesProfilesMatrimony);
router.route("/delete/:id").delete(deleteMatrimonyProfileByUserId);

export default router;
