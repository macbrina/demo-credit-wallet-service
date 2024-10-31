import UserTransaction from "@/models/transactionModel";
import UserWallet from "@/models/walletModel";
import logger from "@/utils/logger";
import { validateWalletCredentials } from "@/utils/validation";
import { NextFunction, Request, Response } from "express";
import { CustomError } from "@/errors/customError";
import { generateRandomNumber } from "@/utils/helper";
import db from "../../db";

class WalletController {
  static async depositFunds(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuth) {
      return next(new CustomError("Unauthorized access", 401));
    }

    const walletId = Number(req.params.wallet_id);
    const walletData = req.body;

    const errors = await validateWalletCredentials({
      ...walletData,
      wallet_id: walletId,
    });

    if (errors.length > 0) {
      return next(new CustomError("Validation errors occurred", 400, errors));
    }

    try {
      await db.transaction(async (trx) => {
        const updatedWallet = await UserWallet.updateUserWalletBalance(
          walletId,
          walletData.amount,
          trx
        );

        if (updatedWallet) {
          const { balance } = updatedWallet;

          const transactionData = await UserTransaction.createTransaction(
            {
              wallet_id: walletId,
              transaction_id: `TXN` + generateRandomNumber(15),
              amount: walletData.amount,
              transaction_type: "deposit",
              status: "success",
            },
            trx
          );

          res.status(200).json({
            message: `Your deposit of N${walletData.amount} was successful! Your new balance is N${balance}.`,
            wallet_id: walletId,
            balance,
            transaction_amount: walletData.amount,
            transaction_id: transactionData.transaction_id,
            transaction_type: transactionData.transaction_type,
            transactiion_status: transactionData.status,
          });
        }
      });
    } catch (error) {
      logger.error(
        (error as Error).message || "Error in wallet deposit process"
      );

      if (error instanceof CustomError) {
        return next(error);
      }

      next(new CustomError("Internal server error", 500));
    }
  }

  static async withdrawFunds(req: Request, res: Response, next: NextFunction) {}

  static async transferFunds(req: Request, res: Response, next: NextFunction) {}
}

export default WalletController;
