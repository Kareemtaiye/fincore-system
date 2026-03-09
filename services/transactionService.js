import crypto from "crypto";
import TransactionRepository from "../repositories/transactionRepository.js";
import pool from "../config/pg.js";
import WalletService from "./walletService.js";
import LedgerEntryService from "./legderEntryService.js";
import generateRef from "../utilities/generateRef.js";

export default class TransactionService {
  static async createDepositTransaction({ amount, userId }) {
    const client = await pool.connect();

    const referenceId = generateRef("DEP");

    let transaction;
    try {
      transaction = await TransactionRepository.createTransaction({
        type: "DEPOSIT",
        reference: referenceId,
        userId,
        amount,
      });

      await client.query("BEGIN");

      const systemWallet = await WalletService.getSystemWallet(client);
      const userWallet = await WalletService.getUserWallet(userId, client);

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
      const updatedWallet = await WalletService.creditUserWallet(
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
      if (transaction?.id) {
        // No client passed here — uses pool, separate connection
        // Optional chaining guards against transaction never being assigned(if the error happens before createTransaction resolves, transaction is undefined and this current catch block may throw another error that may mask the original error, thereby causeing confusion🤪)
        await TransactionService.updateTransactionStatus({
          transactionId: transaction.id,
          status: "FAILED",
        });
      }
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

  static async markDepositAsComplete({ reference, transactionId }, client) {
    return await TransactionRepository.markDepositAsComplete(
      { reference, transactionId },
      client,
    );
  }

  static async getTransactionByRef(reference, client) {
    return TransactionRepository.getTransactionByRef(reference, client);
  }
}
