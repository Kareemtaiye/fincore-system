import { Router } from "express";
import AuthController from "../controllers/authController.js";
import TransactionController from "../controllers/transactionController.js";
import handleAsyncErr from "../utilities/handleAsyncErr.js";

const router = Router();
router.use(AuthController.protect);

router.post(
  "/deposit",
  AuthController.restrictTo("ADMIN"),
  handleAsyncErr(TransactionController.deposit),
);

router.post("/transfer", handleAsyncErr(TransactionController.transfer));
// router.post("/withdraw", handleAsyncErr(TransactionController.withdraw));

export default router;
