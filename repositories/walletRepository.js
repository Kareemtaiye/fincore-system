import pool from "../config/pg.js";

export default class WalletRepository {
  static async createWallet({ userId }, db = pool) {
    const query = `
    INSERT INTO wallets (user_id)
    VALUES ($1)
    RETURNING id, currency
    `;

    const { rows } = await db.query(query, [userId]);

    return rows[0];
  }
}
