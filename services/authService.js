import pool from "../config/pg.js";
import AuthRepository from "../repositories/authRepository.js";
import PasswordUtils from "../utilities/password.js";

export default class AuthService {
  static async register(data) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const hashedPassword = await PasswordUtils.hashPassword(data.password);
      const user = await AuthRepository.createUser({ ...data, password: hashedPassword });

      return user;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      await client.release();
    }
  }
}
