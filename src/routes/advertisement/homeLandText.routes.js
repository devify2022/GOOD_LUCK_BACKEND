import express from "express";
import {
  createHomeLandTextAd,
  deleteHomeLandTextAdByUserId,
  getAllHomeLandTextAds,
  getHomeLandTextAdsByUserId,
  getHomeLandTextAdsByUserIdAndCategory,
  updateHomeLandTextAdByUserId,
} from "../../controllers/advertisement/homeLandText.controller.js";

const router = express.Router();

// Route to create a HomeText ad and a corresponding ServiceAd
router.post("/create", createHomeLandTextAd);

// Route to get all HomeText ads
router.get("/getAll", getAllHomeLandTextAds);

// Route to get HomeText ads by userId
router.get("/getByUserId/:userId", getHomeLandTextAdsByUserId);

// Route to get Home Or Land Text ads by userId nad category
router.get(
  "/getByCategoryUserId/:userId/:category",
  getHomeLandTextAdsByUserIdAndCategory
);

// Route to update HomeText ad by userId
router.patch("/update/:userId", updateHomeLandTextAdByUserId);

// Route to delete HomeText ad by userId
router.delete("/delete/:userId", deleteHomeLandTextAdByUserId);

export default router;
