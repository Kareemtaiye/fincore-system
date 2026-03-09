import WalletRepository from "../repositories/walletRepository.js";
import LedgerEntryService from "./legderEntryService.js";

export default class WalletService {
  static async createWallet(userId, client) {
    return await WalletRepository.createWallet({ userId }, client);
  }

  static async getUserWallet(userId, client) {
    return await WalletRepository.getUserWallet(userId, client);
  }

  static async getSystemWallet(client) {
    return await WalletRepository.getSystemWallet(client);
  }

  static async creditUserWallet({ walletId, amount }, client) {
    return await WalletRepository.creditWallet({ walletId, amount }, client);
  }

  // static async getWalletBalance(walletId, client) {
  //   const walletEntries = await LedgerEntryService.getWalletEntries(walletId, client);

  //   if (walletEntries.length === 0) {
  //     return 0;
  //   }
  // }
}
