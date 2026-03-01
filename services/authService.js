import pool from "../config/pg.js";
import AuthRepository from "../repositories/authRepository.js";
import PasswordUtils from "../utilities/password.js";
import ProfileService from "./profileService.js";
import SessionService from "./sessionService.js";
import TokenService from "./tokenService.js";
import WalletService from "./walletService.js";

export default class AuthService {
  static async register({ email, password, firstName, lastName, role }) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const hashedPassword = await PasswordUtils.hashPassword(password);

      const user = await AuthRepository.createUser(
        {
          email,
          password: hashedPassword,
          role,
        },
        client,
      );
      const accessToken = TokenService.generateAccessToken({
        id: user.id,
        role: user.role,
      });

      const refreshToken = TokenService.generateRefreshToken();

      //Auto create a wallet for new user
      const wallet = await WalletService.createWallet(user.id, client);

      //Auto create profile
      const profile = await ProfileService.createUserProfile(
        { userId: user.id, firstName, lastName },
        client,
      );

      //User session
      await SessionService.createUserSession({ userId: user.id, refreshToken }, client);

      await client.query("COMMIT");
      const userObj = { ...user, ...profile, wallet };

      return { userObj, accessToken, refreshToken };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      await client.release();
    }
  }

  static async login({ email, password }) {
    const client = await pool.connect();

    const user = await AuthRepository.getUserByEmail(email);

    if (!user || !(await PasswordUtils.compare(password, user.password))) {
      return null;
    }

    try {
      await client.query("BEGIN");
      const accessToken = TokenService.generateAccessToken({
        id: user.id,
        role: user.role,
      });
      const refreshToken = TokenService.generateRefreshToken();

      const { password, isactive, ...userObj } = user;

      await SessionService.createUserSession({ userId: user.id, refreshToken }, client);

      await client.query("COMMIT");

      return { userObj, accessToken, refreshToken };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      await client.release();
    }
  }

  static async generateNewAccToken(refreshToken) {
    const session = await SessionService.getUserSession(refreshToken);

    if (session.expires_at < new Date(Date.now())) {
      return null;
    }

    //Detect token resuse
    if (session.revoked_at) {
      await SessionService.revokeAllUserSessions(session.user_id);
      return null;
    }

    //Check if user has not been deactivated
    const { is_active, role } = await AuthRepository.getUserById(session.user_id);

    //Active is returned to check if the user account is still active
    return {
      accessToken: TokenService.generateAccessToken({
        id: session.user_id,
        role,
      }),
      isActive: is_active,
    };
  }
}
