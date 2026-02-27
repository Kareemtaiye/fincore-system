import { Router } from "express";
import AuthController from "../controllers/authController.js";
import handleAsyncErr from "../utilities/handleAsyncErr.js";

const router = Router();
router.post("/signup", handleAsyncErr(AuthController.signup));

export default router;
