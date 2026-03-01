import jwt from "jsonwebtoken";
import crypto from "crypto";

const { ACCESS_TOKEN_SECRET_KEY, ACCESS_TOKEN_EXPIRY_TIME } = process.env;

export default class TokenService {
  static generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_TOKEN_SECRET_KEY, {
      expiresIn: ACCESS_TOKEN_EXPIRY_TIME,
    });
  }

  static generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
  }

  static verifyToken(tokenHash) {
    return jwt.verify(tokenHash, ACCESS_TOKEN_SECRET_KEY);
  }
}
