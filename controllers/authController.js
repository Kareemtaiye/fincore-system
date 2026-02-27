import AuthService from "../services/authService.js";
import AppError from "../utilities/AppError.js";

export default class AuthController {
  static async signup(req, res, next) {
    const { email, password, role = "USER" } = req.body || {};

    //Check for incoming reqbody

    if (!req.body || Object.keys(req.body).length === 0) {
      return next(new AppError(400, "Request body is required"));
    }

    if (!email || !password) {
      return next(new AppError("Email and password required for creating account", 400));
    }

    //Check for valid role
    if (role && !["USER", "ADMIN"].includes(role)) {
      return next(new AppError(`Invalid user role (${role})`, 400));
    }

    const user = await AuthService.register({ email, password, role });
    res.status(200).json({
      status: "success",
      user,
    });
  }

  static async restrictTo() {}

  static async protect(req, res, next) {}
}
