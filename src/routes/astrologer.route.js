import { Router } from "express";
import { createAstrologer, deleteAstrologerById, getAllAstrologers, getAstrologerById, updateAstrologerById } from "../controllers/astrologerController.js";
const router = Router();

router.route("/createAstrologer").post(createAstrologer);
router.route("/").get(getAllAstrologers);
router.route("/:id").get(getAstrologerById);
router.route("/update/:id").patch(updateAstrologerById);
router.route("/delete/:id").delete(deleteAstrologerById);

export default router;
