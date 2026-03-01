import WalletRepository from "../repositories/walletRepository.js";

export default class WalletService {
  static async createWallet({ userId }, client) {
    return await WalletRepository.createWallet({ userId }, client);
  }
}
