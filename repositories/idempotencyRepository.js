import pool from "../config/pg.js";

export default class IdempotencyRepository {
  //Don't forget regualr cleanup or regular table drop for sharding
  static async createIdempotency(
    { idempotencyKey, userId, endpoint, responseStatus, requestBody, requestHash },
    db = pool,
  ) {
    const query = `
    INSERT INTO idempotency_keys 
    (idempotency_key, user_id, response_status, response_body, response_hash)
    VALUES ($1, $2, $3, $4, $5) 
    ON CONFLICT (idempotency_key, user_id) DO NOTHING
    RETURNING *; 
    `; // Asking "Am i first?". if yes, create, if no, fetch the already there

    const { rows } = await db.query(query, [
      idempotencyKey,
      userId,
      responseStatus,
      requestBody,
      requestHash,
    ]);

    return rows[0] || null; //if the pair alreay exists, return nothing(incase logic fails)
  }

  static async checkIdempotencyKey({ idempotencyKey, userId }, db = pool) {
    const query = ` 
    SELECT * 
        FROM idempotency_keys 
    WHERE 
        idempotency_key = $1 
        AND user_id = $2
        AND expires_at > NOW()
    FOR UPDATE
    `;

    const { rows } = await db.query(query, [idempotencyKey, userId]);
    return rows[0] || null;
  }
}
