import SessionRepository from "../repositories/sessionRepository.js";

export default class SessionService {
  static async createUserSession({ userId, refreshToken }, client) {
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    await SessionRepository.createSession({ userId, refreshToken, expiresAt }, client);
  }

  static async getUserSession(refreshToken, client) {
    return await SessionRepository.getSessionByToken(refreshToken, client);
  }

  static async revokeAllUserSessions(userId, client) {
    await SessionRepository.revokeAllSessions(userId, client);
  }
}
