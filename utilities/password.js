import bcrypt from "bcrypt";

export default class PasswordUtils {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }
}
