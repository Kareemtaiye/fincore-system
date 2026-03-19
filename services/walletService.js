import WalletRepository from "../repositories/walletRepository.js";
import LedgerEntryService from "./legderEntryService.js";

export default class WalletService {
  static async createWallet(userId, client) {
    return await WalletRepository.createWallet(userId, client);
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

  static async getWalletBalance(walletId, client) {
    return await WalletRepository.getWalletBalance(walletId, client);
  }

  static async getToAndFromWallets({ fromWalletId, toWalletId }, client) {
    const result = await WalletRepository.getToAndFromWallets(
      { fromWalletId, toWalletId },
      client,
    );

    if (result.length !== 2) {
      return null; // One or both wallets not found
    }

    const fromWallet = result.find(wallet => wallet.id === fromWalletId);
    const toWallet = result.find(wallet => wallet.id === toWalletId);

    console.log({ fromWallet, toWallet });

    return { fromWallet, toWallet };
  }

  static async debitUserWallet({ walletId, amount }, client) {
    return await WalletRepository.debitWallet({ walletId, amount }, client);
  }
}
