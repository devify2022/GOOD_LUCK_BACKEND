import { Router } from "express";
import {
  createDatingProfile,
  deleteDatingProfile,
  getAllDatingProfiles,
  getDatingProfileById,
  updateDatingProfile,
} from "../controllers/dating.controller.js";

const router = Router();

router.route("/createDatingProfile/:id").post(createDatingProfile);
router.route("/").get(getAllDatingProfiles);
router.route("/:id").get(getDatingProfileById);
router.route("/update/:id").patch(updateDatingProfile);
router.route("/delete/:id").delete(deleteDatingProfile);

export default router;
