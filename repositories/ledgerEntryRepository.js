import pool from "../config/pg.js";

export default class LedgerEntryRepository {
  static async createLegderEntry({ walletId, transactionId, type, amount }, db = pool) {
    const query = `
    INSERT INTO ledger_entries (wallet_id, transaction_id, amount, type)
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `;

    await db.query(query, [walletId, transactionId, amount, type]);
  }

  static async getAllEntries(db = pool) {
    const query = `
    SELECT * FROM ledger_entries
     `;

    const { rows } = await db.query(query);
    return rows;
  }

  static async getWalletEntries(walletId, db = pool) {
    const query = `
    SELECT * FROM ledger_entries
    WHERE wallet_id = $1
    `;

    const { rows } = await db.query(query, [walletId]);
    return rows;
  }

  static async getWalletBalance(walletId, db = pool) {
    const query = `
    SELECT
        SUM(CASE WHEN type = 'CREDIT' THEN amount ELSE 0 END) - 
        SUM(CASE WHEN type = 'DEBIT' THEN amount ELSE 0 END)
        AS balance
    FROM
        ledger_entries
    WHERE 
        wallet_id = $1
    `;

    const { rows } = await db.query(query, [walletId]);

    return rows[0] || null;
  }
}
