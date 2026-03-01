import { Router } from "express";
import AuthController from "../controllers/authController.js";
import handleAsyncErr from "../utilities/handleAsyncErr.js";

const router = Router();
router.post("/signup", handleAsyncErr(AuthController.signup));
router.post("/login", handleAsyncErr(AuthController.login));
router.get("/refresh", handleAsyncErr(AuthController.refreshAccessToken));

export default router;
