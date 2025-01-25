import { Router } from "express";
import {
  addBalanceToAstrologerWallet,
  approveAstrologer,
  createAstrologerRequest,
  deleteAstrologerById,
  getAllAstrologers,
  getAllPendingRequests,
  getAllRejectedRequests,
  getAllReviewsByAstrologerId,
  getAllUpdateRequestAstrologers,
  getAstrologerById,
  getPendingRequestById,
  getRejectedRequestById,
  getUpdateRequestAstrologerById,
  getWalletBalanceById,
  giveReviewToAstrologer,
  rejectAstrologer,
  updateRequestAstrologerProfile,
  verifyAstrologerProfileUpdateOTP,
} from "../../controllers/astrologer/astrologerController.js";

const router = Router();

router.route("/createAstrologerRequest").post(createAstrologerRequest);
router.route("/approve/:id").post(approveAstrologer);
router.route("/reject/:id").patch(rejectAstrologer);
router.get("/pending", getAllPendingRequests);
router.get("/pending/:id", getPendingRequestById);
router.get("/rejected", getAllRejectedRequests);
router.get("/rejected/:id", getRejectedRequestById);
router.route("/").get(getAllAstrologers);
router.route("/:id").get(getAstrologerById);
router.route("/updateRequest/:id").post(updateRequestAstrologerProfile);
router.route("/verifyOTPandUpdate/:id").patch(verifyAstrologerProfileUpdateOTP);
router.get("/update-requests", getAllUpdateRequestAstrologers);
router.get("/update-requests/:id", getUpdateRequestAstrologerById);
router.route("/astroWallet/addBalance/:id").patch(addBalanceToAstrologerWallet);
router.route("/delete/:id").delete(deleteAstrologerById);
router.get("/wallet-balance/:id", getWalletBalanceById);
router.post("/post-review/:id", giveReviewToAstrologer);
router.get("/getall-reviews/:id", getAllReviewsByAstrologerId);


export default router;
