import WebhookRepository from "../repositories/webhookRepository.js";

export default class WebhookService {
  static async createWebhookEvent({ eventId, payload }) {
    return await WebhookRepository.createWebhookEvent({ eventId, payload });
  }
}
