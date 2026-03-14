import IdempotencyRepository from "../repositories/idempotencyRepository.js";

export default class IdempotencyService {
  static async createIdempotencyEntry(
    { idempotencyKey, userId, responseStatus, responseBody, requestHash },
    client,
  ) {
    return await IdempotencyRepository.createIdempotency(
      { idempotencyKey, userId, responseStatus, responseBody, requestHash },
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
