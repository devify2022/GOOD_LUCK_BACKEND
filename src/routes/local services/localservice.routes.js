import { Router } from "express";
import {
  createLocalService,
  deleteLocalService,
  getAllLocalServices,
  getLocalServiceById,
  updateLocalService,
} from "../../controllers/local services/localservice.controller.js";

const router = Router();

router.route("/create").post(createLocalService);
router.route("/getAll").get(getAllLocalServices);
router.route("/get/:id").get(getLocalServiceById);
router.route("/update/:id").patch(updateLocalService);
router.route("/delete/:id").delete(deleteLocalService);

export default router;
