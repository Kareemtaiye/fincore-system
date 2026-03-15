import TransactionRepository from "../repositories/transactionRepository.js";
import pool from "../config/pg.js";
import WalletService from "./walletService.js";
import LedgerEntryService from "./legderEntryService.js";
import generateRef from "../utilities/generateRef.js";
import IdempotencyService from "./idempotencyService.js";

export default class TransactionService {
  static async createDepositTransaction({ amount, userId, idempotencyKey, requestHash }) {
    const client = await pool.connect();
    console.log(requestHash, "  sdfgh   ");

    const referenceId = generateRef("DEP");

    //Create a trabsaction entry(pending)
    const transaction = await TransactionRepository.createTransaction({
      type: "DEPOSIT",
      reference: referenceId,
      userId,
      amount,
    });

    try {
      await client.query("BEGIN");

      //Call the provider
      const response = await fetch("http://localhost:8081/api/v1/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
          authorization:
            "Bearer fp_test_a18c1826ffd6873a4950a47018cbd089b397fc76bdf02226",
        },
        body: JSON.stringify({
          amount: amount,
          currency: "NGN",
          merchant_ref: referenceId,
          metadata: { product: "Data about the product. later on" },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        // Throwing here sends control to the catch block
        throw new Error(errorBody?.message || `Provider error: ${response.status}`);
      }

      const data = await response.json();

      console.log("DATA from provider: ", data);

      await client.query("COMMIT");

      const responseBody = {
        status: "success",
        data: {
          amount: data.data.amount,
          currency: data.data.currency,
          reference: referenceId,
          status: data.data.status,
          payment_url: data.data.authorization_url,
        },
      };

      // Store response
      await IdempotencyService.createIdempotencyEntry(
        {
          idempotencyKey,
          userId,
          requestHash,
          responseStatus: 201,
          responseBody,
        },
        client,
      );

      //Return payment url
      return responseBody;
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

  static async createTransferTransaction({
    amount,
    from,
    to,
    idempotencyKey,
    requestHash,
  }) {
    const client = await pool.connect();
    const referenceId = generateRef("TRF");

    //Create a transaction entry(pending)
    const transaction = await TransactionRepository.createTransaction({
      type: "TRANSFER",
      reference: referenceId,
      userId: from,
      amount,
    });

    try {
      await client.query("BEGIN");

      //Get the from user wallet
      const userWallet = await WalletService.getUserWallet(from, client);
      if (!userWallet) {
        throw new Error("Sender wallet not found");
      }

      //Get both wallets and lock them for update
      const result = await WalletService.getToAndFromWallets(
        { toWalletId: to, fromWalletId: userWallet.id },
        client,
      );

      //Could trhow error or return null, depending on how you want to handle it. I prefer returning null and handling it gracefully in the service layer, rather than throwing an error from the repository layer, which is more of a data access layer and should ideally not contain business logic like error handling for missing wallets.
      if (!result) {
        throw new Error("One or both wallets not found");
      }

      //Sender amount check
      if (result.fromWallet.balance < amount) {
        throw new Error("Insufficient balance");
      }

      //Debit the sender
      await WalletService.debitUserWallet(
        { walletId: result.fromWallet.id, amount },
        client,
      );

      //Credit the recipient
      await WalletService.creditUserWallet(
        { walletId: result.toWallet.id, amount },
        client,
      );

      //Create ledger entry for sender and recipient
      await LedgerEntryService.createEntry(
        {
          walletId: result.fromWallet.id,
          transactionId: transaction.id,
          type: "DEBIT",
          amount,
        },
        client,
      );

      await LedgerEntryService.createEntry(
        {
          walletId: result.toWallet.id,
          transactionId: transaction.id,
          type: "CREDIT",
          amount,
        },
        client,
      );

      //Mark transaction as completed
      await TransactionRepository.updateTransactionStatus(
        { transactionId: transaction.id, status: "COMPLETED" },
        client,
      );

      // Store response

      const responseBody = {
        status: "success",
        data: {
          amount,
          reference: referenceId,
          status: "COMPLETED",
          from: result.fromWallet.user_id,
          to: result.toWallet.user_id,
        },
      };

      await IdempotencyService.createIdempotencyEntry(
        {
          idempotencyKey,
          userId: from,
          requestHash,
          responseStatus: 201,
          responseBody,
        },
        client,
      );

      await client.query("COMMIT");

      return responseBody;
    } catch (err) {
      await client.query("ROLLBACK");

      //Mark transaction as failed
      if (transaction?.id) {
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

  static async createWithdrawalTransaction() {}

  static async updateTransactionStatus({ transactionId, status }, client) {
    return await TransactionRepository.updateTransactionStatus(
      { transactionId, status },
      client,
    );
  }

  static async markDepositAsComplete({ providerReference, transactionId }, client) {
    return await TransactionRepository.markDepositAsComplete(
      { providerReference, transactionId },
      client,
    );
  }

  static async getTransactionByRef(reference, client) {
    return TransactionRepository.getTransactionByRef(reference, client);
  }
}
