import crypto from "crypto";
import IdempotencyService from "../services/idempotencyService.js";
import TransactionService from "../services/transactionService.js";
import WalletService from "../services/walletService.js";
import AppError from "../utilities/AppError.js";

export default class TransactionController {
  static async deposit(req, res, next) {
    const { to, amount } = req.body || {};

    const idempotencyKey = req.header("Idempotency-Key");

    if (!req.body || Object.keys(req.body).length === 0) {
      return next(new AppError("Request body is required", 400));
    }

    if (!idempotencyKey) {
      return next(new AppError("Missing Idempotency-Key header"));
    }

    if (!to || !amount) {
      return next(
        new AppError("Please specify where to deposit into and the amount", 400),
      );
    }

    if (amount <= 0) {
      return next(new AppError("Amount cannot be 0 or negative", 400));
    }

    const requestHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(req.body))
      .digest("hex");

    //Check if key exists
    const record = await IdempotencyService.checkIdempotencyKey({
      idempotencyKey,
      userId: req.user.id,
    });

    if (record) {
      //Prevent misuse with different payload
      if (record.request_hash !== requestHash) {
        return next(new AppError("Idempotency-Key resued with different Payload", 409));
      }

      //return stored response.
      return res.status(record.response_status).json(record.response_body);
    }

    // May be uncommented later if other things can go wrong apart from not finding the user wallet(due to invalid user id or something)--- More clear
    const walletExist = await WalletService.getUserWallet(to);
    if (!walletExist) {
      return next(new AppError("Cannot find user wallet. Please check again.", 400));
    }

    const transactionData = await TransactionService.createDepositTransaction({
      to,
      amount,
    });

    const responseBody = {
      status: "success",
      data: transactionData,
    };

    //Store response
    IdempotencyService.createIdempotencyEntry({});

    res.status(201).json(responseBody);
  }
}
