import pool from "../config/pg.js";

export default class SessionRepository {
  static async createSession({ userId, refreshToken, expiresAt }, db = pool) {
    const query = `
        INSERT INTO sessions (user_id, refresh_token, expires_at)
        VALUES ($1, $2, $3)
        RETURNING *
        `;

    await db.query(query, [userId, refreshToken, expiresAt]);
  }

  static async getSessionByToken(refreshToken, db = pool) {
    const query = ` 
    SELECT * FROM sessions WHERE refresh_token = $1
    `;

    const { rows } = await db.query(query, [refreshToken]);
    return rows[0] || null;
  }

  static async revokeAllSessions(userId, db = pool) {
    const query = `UPDATE sessions 
    SET revoked_at = NOW() 
    WHERE user_id = $1
    `;

    const rows = await db.query(query, [userId]);
    console.log(rows);
  }
}
