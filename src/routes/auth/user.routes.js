import { Router } from "express";

import {
  addWalletBalance,
  auth_request_verify_OTP,
  authRequest,
  getWalletBalanceByUserId,
  login_verify_OTP,
  loginUser,
  refreshAccessToken,
  resendOTP,
} from "../../controllers/auth/user.controller.js";
import { verifyJWT } from "./../../middlewares/auth.middleware.js";
const router = Router();

router.route("/newUserRequest").post(authRequest);
router.route("/authRequestVerifyotp").post(auth_request_verify_OTP);
router.route("/login").post(loginUser);
router.route("/loginVerifyotp").post(login_verify_OTP);
router.route("/resend_otp").post(resendOTP);
router.route("/userWallet/addBalance/:userId").patch(addWalletBalance);
router.get('/wallet-balance/:userId', getWalletBalanceByUserId);

// secure routes
// router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh_token").post(verifyJWT, refreshAccessToken);

export default router;
