import pool from "../config/pg.js";

export default class TransactionRepository {
  static async createTransaction({ type, reference }, db = pool) {
    const query = `
    INSERT INTO transactions (type, reference)
    VALUES ($1, $2)
    RETURNING *
    `;

    const { rows } = await db.query(query, [type, reference]);
    return rows[0];
  }

  static async updateTransactionStatus({ transactionId, status }, db = pool) {
    const query = `
    UPDATE transactions 
    SET status = $1
    WHERE id = $2
    RETURNING *
    `;

    const { rows } = await db.query(query, [status, transactionId]);
    // return rows.rowCount;
    return rows[0];
  }
}
