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
router.post("/create", createJobTextAd);

// Route to get all JobText ads
router.get("/", getAllJobTextAds);

// Route to get JobText ads by userId
router.get("/:userId", getJobTextAdsByUserId);

// Route to update JobText ad by userId
router.patch("/update/:userId", updateJobTextAdByUserId);

// Route to delete JobText ad by userId
router.delete("/delete/:userId", deleteJobTextAdByUserId);

export default router;
