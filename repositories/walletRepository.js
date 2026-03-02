import pool from "../config/pg.js";

export default class WalletRepository {
  static async createWallet(userId, db = pool) {
    const query = `
    INSERT INTO wallets (user_id)
    VALUES ($1)
    RETURNING id, currency
    `;

    const { rows } = await db.query(query, [userId]);
    return rows[0];
  }

  static async getSystemWallet(db = pool) {
    const query = ` 
    SELECT * FROM wallets WHERE is_system = TRUE
    `;

    const { rows } = await db.query(query);
    return rows[0] || null;
  }

  static async getUserWallet(userId, db = pool) {
    const query = ` 
    SELECT * FROM wallets WHERE user_id = $1
    `;

    const { rows } = await db.query(query, [userId]);
    return rows[0] || null;
  }

  static async updateWalletBalance({ walletId, amount }, db = pool) {
    const query = `
    UPDATE wallets 
    SET balance = balance + $1 
    WHERE id = $2
    RETURNING balance
    `;

    const { rows } = await db.query(query, [amount, walletId]);
    return rows[0];
  }
}
