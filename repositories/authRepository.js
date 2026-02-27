import pool from "../config/pg.js";

export default class AuthRepository {
  static async createUser({ email, password, role }, db = pool) {
    const query = `
    INSERT INTO users (email, password, role)
    VALUES ($1, $2, $3)
    RETURNING *
    `;

    const { rows } = await pool.query(query, [email, password, role]);

    return rows[0];
  }
}
