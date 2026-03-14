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

    let transaction;
    try {
      await client.query("BEGIN");

      //Create a trabsaction entry(def is pending)
      transaction = await TransactionRepository.createTransaction({
        type: "DEPOSIT",
        reference: referenceId,
        userId,
        amount,
      });

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

  static async createTransferTransaction() {
    //SELECT ... FOR UPDATE.
  }

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
