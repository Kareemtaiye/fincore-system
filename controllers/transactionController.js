import TransactionService from "../services/transactionService.js";
import WalletService from "../services/walletService.js";
import AppError from "../utilities/AppError.js";

export default class TransactionController {
  static async deposit(req, res, next) {
    const { to, amount } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
      return next(new AppError("Request body is required", 400));
    }

    if (!to || !amount) {
      return next(
        new AppError("Please specify where to deposit into and the amount", 400),
      );
    }

    if (amount <= 0) {
      return next(new AppError("Amount cannot be 0 or negative", 400));
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

    res.status(201).json({
      status: "success",
      data: transactionData,
    });
  }
}
