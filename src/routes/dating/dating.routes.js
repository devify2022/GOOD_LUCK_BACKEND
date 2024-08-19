import { Router } from "express";
import {
  createDatingProfile,
  deleteDatingProfileByUserId,
  getAllDatingProfiles,
  getDatingProfileByUserId,
  updateDatingProfileByUserId,
} from "../../controllers/dating/dating.controller.js";

const router = Router();

router.route("/createDatingProfile/:id").post(createDatingProfile);
router.route("/").get(getAllDatingProfiles);
router.route("/:id").get(getDatingProfileByUserId);
router.route("/update/:id").patch(updateDatingProfileByUserId);
router.route("/delete/:id").delete(deleteDatingProfileByUserId);

export default router;
