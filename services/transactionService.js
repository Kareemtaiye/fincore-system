import crypto from "crypto";
import TransactionRepository from "../repositories/transactionRepository.js";
import pool from "../config/pg.js";
import WalletService from "./walletService.js";
import LedgerEntryService from "./legderEntryService.js";

export default class TransactionService {
  static async createDepositTransaction({ to, amount }) {
    const client = await pool.connect();

    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const millisec = d.getMilliseconds();

    const formattedDate = `${year}${month}${day}${millisec}`;

    const referenceId = `DEP_${formattedDate}_${crypto.randomBytes(6).toString("hex").toUpperCase()}`;

    let transaction;
    try {
      const systemWallet = await WalletService.getSystemWallet(client);
      const userWallet = await WalletService.getUserWallet(to, client);

      transaction = await TransactionRepository.createTransaction({
        type: "DEPOSIT",
        reference: referenceId,
      });

      await client.query("BEGIN");

      //Debit the system
      await LedgerEntryService.createEntry(
        {
          walletId: systemWallet.id,
          transactionId: transaction.id,
          type: "DEBIT",
          amount,
        },
        client,
      );

      //Credit the user
      await LedgerEntryService.createEntry(
        {
          walletId: userWallet.id,
          transactionId: transaction.id,
          type: "CREDIT",
          amount,
        },
        client,
      );

      //Update the user wallet balance
      const updatedWallet = await WalletService.updateWalletBalance(
        {
          walletId: userWallet.id,
          amount,
        },
        client,
      );

      //Mark transaction as Completed
      const completedTransaction = await TransactionService.updateTransactionStatus(
        {
          transactionId: transaction.id,
          status: "COMPLETED",
        },
        client,
      );

      await client.query("COMMIT");

      //Return infooo
      return {
        reference: completedTransaction.reference,
        transaction_type: completedTransaction.type,
        amount,
        from_wallet_id: systemWallet.id,
        to_wallet_id: userWallet.user_id,
        status: "COMPLETED",
        balance: updatedWallet.balance,
        created_at: completedTransaction.created_at,
      };
    } catch (err) {
      await client.query("ROLLBACK");

      //Mark transaction as failed
      await TransactionService.updateTransactionStatus({
        transactionId: transaction.id,
        status: "FAILED",
      });

      throw err;
    } finally {
      await client.release();
    }
  }

  static async createTransferTransaction() {
    //SELECT ... FOR UPDATE.
  }

  static async updateTransactionStatus({ transactionId, status }, client) {
    return await TransactionRepository.updateTransactionStatus(
      { transactionId, status },
      client,
    );
  }
}
