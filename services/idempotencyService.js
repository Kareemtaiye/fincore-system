import IdempotencyRepository from "../repositories/idempotencyRepository.js";

export default class IdempotencyService {
  static async createIdempotencyEntry(
    { idempotencyKey, userId, endpoint, responseStatus, requestBody, requestHash },
    client,
  ) {
    return await IdempotencyRepository.createIdempotency(
      { idempotencyKey, userId, responseStatus, requestBody, requestHash },
      client,
    );
  }

  static async checkIdempotencyKey({ idempotencyKey, userId }, client) {
    return await IdempotencyRepository.checkIdempotencyKey(
      { idempotencyKey, userId },
      client,
    );
  }
}
