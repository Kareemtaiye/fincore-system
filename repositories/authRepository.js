import pool from "../config/pg.js";

export default class AuthRepository {
  static async createUser({ email, password, role }, db = pool) {
    const query = `
    INSERT INTO users (email, password, role)
    VALUES ($1, $2, $3)
    RETURNING id, email, role, created_at
    `;

    const { rows } = await db.query(query, [email, password, role]);

    return rows[0];
  }

  static async getUserById(id, db = pool) {
    const query = `
    SELECT * FROM users WHERE id = $1
    `;

    const { rows } = await db.query(query, [id]);
    return rows[0] || null;
  }

  static async getUserByEmail(email, db = pool) {
    const query = `
    SELECT * FROM users WHERE email = $1
    `;

    const { rows } = await db.query(query, [email]);
    return rows[0] || null;
  }
}
