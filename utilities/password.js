import bcrypt from "bcrypt";

export default class PasswordUtils {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  static async compare(password, hashedPass) {
    return await bcrypt.compare(password, hashedPass);
  }
}
