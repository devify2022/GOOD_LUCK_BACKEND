import { Router } from "express";
import { checkStatus, createPayment } from "../../controllers/payment/payment.controller.js";


const router = Router();

router.post("/pay", createPayment);
router.get("/redirect-url/:merchantTransactionId", checkStatus);

export default router;
