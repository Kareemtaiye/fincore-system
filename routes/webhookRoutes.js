import { Router } from "express";
import WebhookHandler from "../controllers/webHookController.js";
import handleAsyncErr from "../utilities/handleAsyncErr.js";

const router = Router();

router.post(
  "/fake-payment-provider",
  handleAsyncErr(WebhookHandler.handlePaymentWebhook),
);

export default router;
