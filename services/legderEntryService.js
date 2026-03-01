import LedgerEntryRepository from "../repositories/ledgerEntryRepository.js";

export default class LedgerEntryService {
  static async createEntry({ walletId, transactionId, type, amount }, client) {
    await LedgerEntryRepository.createLegderEntry(
      { walletId, transactionId, type, amount },
      client,
    );
  }

  static async getWalletEntries(walletId, client) {
    return await LedgerEntryRepository.getWalletEntries(walletId, client);
  }

  static async getWalletBalance(walletId, client) {
    return await LedgerEntryRepository.getWalletBalance(walletId, client);
  }
}
