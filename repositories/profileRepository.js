import pool from "../config/pg.js";

export default class ProfileRepository {
  static async createProfile({ userId, firstName, lastName }, db = pool) {
    const query = `
    INSERT INTO user_profiles (user_id, first_name, last_name)
    VALUES ($1, $2, $3)
    RETURNING first_name, last_name, phone
    `;

    const { rows } = await db.query(query, [userId, firstName, lastName]);

    return rows[0];
  }
}
