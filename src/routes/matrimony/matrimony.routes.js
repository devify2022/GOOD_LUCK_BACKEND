import { Router } from "express";
import {
  createMatrimonyProfile,
  deleteMatrimonyProfileByUserId,
  getAllMatrimonyProfile,
  getMatrimonyProfileByUserId,
  updateMatrimonyProfileByUserId,
} from "../../controllers/matrimony/matrimony.controller.js";

const router = Router();

router.route("/createMatrimonyProfile/:id").post(createMatrimonyProfile);
router.route("/").get(getAllMatrimonyProfile);
router.route("/:id").get(getMatrimonyProfileByUserId);
router.route("/update/:id").patch(updateMatrimonyProfileByUserId);
router.route("/delete/:id").delete(deleteMatrimonyProfileByUserId);

export default router;
