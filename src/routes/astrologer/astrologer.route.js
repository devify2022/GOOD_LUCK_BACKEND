import { Router } from "express";
import {
  addBalanceToAstrologerWallet,
  createAstrologer,
  deleteAstrologerById,
  getAllAstrologers,
  getAstrologerById,
  updateRequestAstrologerProfile,
  verifyAstrologerProfileUpdateOTP,
} from "../../controllers/astrologer/astrologerController.js";

const router = Router();

router.route("/createAstrologer").post(createAstrologer);
router.route("/").get(getAllAstrologers);
router.route("/:id").get(getAstrologerById);
router.route("/updateRequest/:id").post(updateRequestAstrologerProfile);
router.route("/verifyOTPandUpdate/:id").patch(verifyAstrologerProfileUpdateOTP);
router.route("/astroWallet/addBalance/:id").patch(addBalanceToAstrologerWallet);
router.route("/delete/:id").delete(deleteAstrologerById);

export default router;
