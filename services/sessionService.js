import SessionRepository from "../repositories/sessionRepository.js";

export default class SessionService {
  static async createUserSession({ userId, refreshToken, role }, client) {
    await SessionRepository.createSession({ userId, refreshToken, role }, client);
  }

  static async getUserSession(refreshToken, client) {
    return await SessionRepository.getSessionByToken(refreshToken, client);
  }

  static async revokeAllUserSessions(userId, client) {
    return await SessionRepository.revokeAllSessions(userId, client);
  }
}
