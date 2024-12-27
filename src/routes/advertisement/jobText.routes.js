import express from "express";
import {
  createJobTextAd,
  deleteJobTextAdByUserId,
  getAllJobTextAds,
  getJobTextAdsByUserId,
  updateJobTextAdByUserId,
} from "../../controllers/advertisement/jobText.controller.js";

const router = express.Router();

// Route to create a JobText ad and a corresponding ServiceAd
router.post("/", createJobTextAd);

// Route to get all JobText ads
router.get("/", getAllJobTextAds);

// Route to get JobText ads by userId
router.get("/:userId", getJobTextAdsByUserId);

// Route to update JobText ad by userId
router.put("/:userId", updateJobTextAdByUserId);

// Route to delete JobText ad by userId
router.delete("/:userId", deleteJobTextAdByUserId);

export default router;
