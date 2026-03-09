import crypto from "crypto";
import AppError from "../utilities/AppError.js";
import TransactionService from "../services/transactionService.js";
import WebhookService from "../services/webhookService.js";
import pool from "../config/pg.js";
import WalletService from "../services/walletService.js";
import LedgerEntryService from "../services/legderEntryService.js";

const { FAKE_PAYMENT_PROVIDER_WEBHOOK_SECRET } = process.env;

export default class WebhookHandler {
  static async handlePaymentWebhook(req, res, next) {
    const expectedSignature = crypto
      .createHmac("sha256", FAKE_PAYMENT_PROVIDER_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest("hex");

    //Confirm the provider
    if (req.headers["x-provider-signature"] !== expectedSignature) {
      return next(new AppError("Invalid signature", 401));
    }

    const { data, event } = req.body || {};

    //Fetch the transaction
    const transaction = await TransactionService.getTransactionByRef(data.reference);
    if (!transaction) {
      return next(new AppError("Transaction cannot be found", 404));
    }

    //Preventing dupl trans.
    if (transaction.status === "COMPLETED") {
      res.status(200).send("Already processed");
    }

    //If it fails
    if (event === "payment.failed") {
      //Update status
      await TransactionService.updateTransactionStatus({
        transactionId: transaction.id,
        status: "FAILED",
      });

      res.status(200).send("Failed recorded");
    }

    //If it was successful
    if (event === "payment.success") {
      try {
        const client = pool.connect();

        await client.query("BEGIN");

        const systemWallet = await WalletService.getSystemWallet(client);
        const userWallet = await WalletService.getUserWallet(req.user.id, client);

        //Debit the system
        await LedgerEntryService.createEntry(
          {
            walletId: systemWallet.id,
            transactionId: transaction.id,
            type: "DEBIT",
            amount: data.amount,
          },
          client,
        );

        //Credit the user
        await LedgerEntryService.createEntry(
          {
            walletId: userWallet.id,
            transactionId: transaction.id,
            type: "CREDIT",
            amount: data.amount,
          },
          client,
        );

        //Update the user wallet balance
        const updatedWallet = await WalletService.creditUserWallet(
          {
            walletId: userWallet.id,
            amount: data.amount,
          },
          client,
        );

        //Mark transaction as Completed
        const completedTransaction = await TransactionService.markDepositAsComplete(
          {
            reference: data.reference,
            transactionId: transaction.id,
          },
          client,
        );

        // Store event in db
        await WebhookService.createWebhookEvent({ eventId: event.id, payload: data });

        await client.query("COMMIT");

        res.status(200).send("ok");

        return {
          reference: completedTransaction.reference,
          status: "COMPLETED",
          transaction_type: completedTransaction.type,
          amount: data.amount,
          to_wallet_id: userWallet.id,
          balance: updatedWallet.balance,
          created_at: completedTransaction.created_at,
        };
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        await client.release();
      }
    }
  }
}
