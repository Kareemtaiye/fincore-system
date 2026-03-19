import pool from "../config/pg.js";

export default class TransactionRepository {
  static async createTransaction({ type, reference, userId, amount }, db = pool) {
    const query = `
    INSERT INTO transactions (type, reference, user_id, amount)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `;

    const { rows } = await db.query(query, [type, reference, userId, amount]);
    return rows[0];
  }

  // static async getTrANS ({ from, to, amount }, db = pool) {

  //   const query = `
  //   UPDATE transactions
  //   `;

  //   const { rows } = await db.query(query, [reference, from, amount, to]);
  //   return rows[0];
  // }

  static async updateTransactionStatus({ transactionId, status }, db = pool) {
    const query = `
    UPDATE transactions 
    SET status = $1,
        updated_at = now()
    WHERE id = $2
    RETURNING *
    `;

    const { rows } = await db.query(query, [status, transactionId]);
    // return rows.rowCount;
    return rows[0];
  }

  static async markDepositAsComplete({ providerReference, transactionId }, db = pool) {
    const query = `
    UPDATE transactions 
    SET provider_reference = $1,
        status = 'COMPLETED',
        updated_at = now()
    WHERE id = $2
    RETURNING *
    `;

    const { rows } = await db.query(query, [providerReference, transactionId]);
    // return rows.rowCount;
    return rows[0];
  }

  static async getTransactionByRef(reference, db = pool) {
    const query = `
    SELECT * FROM transactions 
    WHERE reference = $1
    `;

    const { rows } = await db.query(query, [reference]);

    return rows[0] || null;
  }
}
