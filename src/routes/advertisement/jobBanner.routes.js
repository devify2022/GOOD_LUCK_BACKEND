import express from "express";
import {
  createJobBannerAd,
  deleteJobBannerAdByUserId,
  getAllJobBannerAds,
  getJobBannerAdsByUserId,
  updateJobBannerAdByUserId,
} from "../../controllers/advertisement/jobBanner.controller.js";

const router = express.Router();

// Route to create a JobBanner ad and a corresponding ServiceAd
router.post("/create", createJobBannerAd);

// Route to get all JobBanner ads
router.get("/getAll", getAllJobBannerAds);

// Route to get JobBanner ads by userId
router.get("/getByUserId/:userId", getJobBannerAdsByUserId);

// Route to update JobBanner ad by userId
router.patch("/update/:userId", updateJobBannerAdByUserId);

// Route to delete JobBanner ad by userId
router.delete("/delete/:userId", deleteJobBannerAdByUserId);

export default router;
