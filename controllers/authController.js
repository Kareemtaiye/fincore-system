import AuthService from "../services/authService.js";
import TokenService from "../services/tokenService.js";
import AppError from "../utilities/AppError.js";

const cookieOptions = {
  httpOnly: true, // JS cannot access (XSS protection)
  secure: process.env.NODE_ENV === "production", // HTTPS only in prod
  sameSite: "strict", // Prevent CSRF (use "lax" if cross-site auth)
  maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days
  path: "/api/v1/auth",
};

export default class AuthController {
  static async signup(req, res, next) {
    const { email, password, role = "USER", firstName, lastName } = req.body || {};

    //Check for incoming reqbody
    if (!req.body || Object.keys(req.body).length === 0) {
      return next(new AppError("Request body is required", 400));
    }

    if (!email || !password || !firstName || !lastName) {
      return next(
        new AppError(
          "Email, password, first and last name are required for creating account",
          400,
        ),
      );
    }

    //Check for valid role
    if (role && !["USER", "ADMIN"].includes(role)) {
      return next(new AppError(`Invalid user role (${role})`, 400));
    }

    const { refreshToken, accessToken, userObj } = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
      role: role.toUpperCase(),
    });

    res
      .status(201)
      .cookie("refresh_token", refreshToken, cookieOptions)
      .json({
        status: "success",
        data: {
          user: userObj,
          token: accessToken,
          meta: {
            hasNext: false,
          },
        },
      });
  }

  static async login(req, res, next) {
    const { email, password } = req.body || {};

    //Check for incoming reqbody

    if (!req.body || Object.keys(req.body).length === 0) {
      return next(new AppError("Request body is required", 400));
    }

    if (!email || !password) {
      return next(new AppError("Enter your mmail and password to log in.", 400));
    }

    const userData = await AuthService.login({ email, password });
    if (!userData) {
      return next(new AppError("Invalid email or password", 400));
    }

    const { userObj, accessToken, refreshToken } = userData;

    res
      .status(201)
      .cookie("refresh_token", refreshToken, cookieOptions)
      .json({
        status: "success",
        data: {
          user: userObj,
          token: accessToken,
          meta: {
            hasNext: false,
          },
        },
      });
  }

  static async refreshAccessToken(req, res, next) {
    let refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return next(new AppError("Session expired. Please log in again.", 401));
    }

    //The new access token
    const data = await AuthService.generateNewAccToken(refreshToken);

    if (!data) {
      return next(new AppError("Session expired. Please log in again.", 401));
    }

    const { accessToken, isActive } = data;

    //Deactivated acc.
    if (!isActive) {
      return next(new AppError("Account has been deactivated.", 401));
    }

    res.status(200).json({
      status: "success",
      data: {
        token: accessToken,
      },
    });
  }

  static restrictTo(...roles) {
    return function (req, res, next) {
      if (!roles.includes(req.user.role)) {
        return next(
          new AppError("You do not have permission to perform this action", 401),
        );
      }

      next();
    };
  }

  static async protect(req, res, next) {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return next(
        new AppError("No authorization header. please log in to get access.", 401),
      );
    }

    const { id, role, exp } = TokenService.verifyToken(token);

    if (exp * 1000 < Date.now()) {
      return next(new AppError("Access token expired.", 401));
    }

    req.user = { id, role };

    next();
  }
}
