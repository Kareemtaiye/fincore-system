import pool from "../config/pg.js";

export default class WebhookRepository {
  static async createWebhookEvent({ eventId, payload }, db = pool) {
    const query = `
    INSERT INTO webhook_events (provider_event_id, payload) 
    VALUES ($1, $2)
    RETURNING *
    `;

    const { rows } = await db.query(query, [eventId, payload]);

    return rows[0];
  }
}
