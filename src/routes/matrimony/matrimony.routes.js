import { Router } from "express";
import {
  createMatrimonyProfile,
  deleteMatrimonyProfileByUserId,
  getAllMatrimonyProfile,
  getMatrimonyProfileByUserId,
  getRandomBrides,
  getRandomGrooms,
  updateMatrimonyProfileByUserId,
} from "../../controllers/matrimony/matrimony.controller.js";

const router = Router();

router.route("/createMatrimonyProfile/:id").post(createMatrimonyProfile);
router.route("/").get(getAllMatrimonyProfile);
router.route("/brides").get(getRandomBrides);
router.route("/grooms").get(getRandomGrooms);
router.route("/:id").get(getMatrimonyProfileByUserId);
router.route("/update/:id").patch(updateMatrimonyProfileByUserId);
router.route("/delete/:id").delete(deleteMatrimonyProfileByUserId);

export default router;
