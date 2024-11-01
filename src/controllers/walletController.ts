import UserTransaction, {
  transactionStatus,
  transactionType,
} from "@/models/transactionModel";
import UserWallet from "@/models/walletModel";
import logger from "@/utils/logger";
import { validateWalletCredentials } from "@/utils/validation";
import { NextFunction, Request, Response } from "express";
import { CustomError } from "@/errors/customError";
import { generateRandomNumber, isBalanceSufficient } from "@/utils/helper";
import db from "../../db";
import { Knex } from "knex";
import { format } from "date-fns";

class WalletController {
  static async getUserBalance(req: Request, res: Response, next: NextFunction) {
    this.checkAuth(req, next);

    try {
      const userWalletInfo = await UserWallet.getUserWalletInfo(
        undefined,
        Number(req.userId)
      );

      if (!userWalletInfo) {
        return next(new CustomError("User wallet not found", 404));
      }

      res.status(200).json({ balance: userWalletInfo.balance });
    } catch (error) {
      this.handleError(error, next);
    }
  }
  static async depositFunds(req: Request, res: Response, next: NextFunction) {
    this.checkAuth(req, next);

    const walletId = Number(req.params.wallet_id);
    const walletData = req.body;

    try {
      await this.validateWalletData(walletData, walletId, next);

      await db.transaction(async (trx) => {
        const updatedWallet = await UserWallet.updateUserWalletBalance(
          walletId,
          walletData.amount,
          trx,
          "add"
        );

        if (updatedWallet) {
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

          res
            .status(200)
            .json(
              this.buildResponse(
                `Your deposit of N${walletData.amount} was successful! Your new balance is N${updatedWallet.balance}.`,
                walletId,
                updatedWallet.balance,
                walletData,
                transactionData
              )
            );
        }
      });
    } catch (error) {
      this.handleError(error, next);
    }
  }

  static async transferFunds(req: Request, res: Response, next: NextFunction) {
    this.checkAuth(req, next);

    const recipientWalletId = Number(req.params.wallet_id);
    const walletData = req.body;

    try {
      await this.validateWalletData(walletData, recipientWalletId, next);

      const [senderWalletInfo, recipientWalletInfo] = await Promise.all([
        UserWallet.getUserWalletInfo(undefined, Number(req.userId)),
        UserWallet.getUserWalletInfo(recipientWalletId),
      ]);

      if (!senderWalletInfo || !recipientWalletInfo) {
        return next(new CustomError("Invalid wallet information", 404));
      }

      await db.transaction(async (trx) => {
        if (!isBalanceSufficient(senderWalletInfo.balance, walletData.amount)) {
          return await this.handleFailedTransaction(
            senderWalletInfo,
            recipientWalletInfo,
            walletData.amount,
            trx,
            next
          );
        }

        const updatedWallet = await UserWallet.processWalletTransfer(
          senderWalletInfo.wallet_id,
          recipientWalletId,
          walletData.amount,
          trx
        );

        if (updatedWallet) {
          const transactionData = await this.createTransactionRecord(
            senderWalletInfo.wallet_id,
            walletData.amount,
            "transfer",
            "success",
            trx,
            recipientWalletId
          );

          const createdAtDate = transactionData.created_at
            ? new Date(transactionData.created_at)
            : new Date();

          res.status(200).json({
            message: `Your transfer of N${walletData.amount} was successful! Your new balance is N${updatedWallet.balance}.`,
            recipient_wallet_id: recipientWalletInfo.wallet_id,
            sender_wallet_id: senderWalletInfo.wallet_id,
            sender_name: senderWalletInfo.name,
            recipient_name: recipientWalletInfo.name,
            available_balance: updatedWallet.balance,
            transaction_amount: walletData.amount,
            transaction_id: transactionData.transaction_id,
            transaction_type: transactionData.transaction_type,
            transaction_date: format(createdAtDate, "yyyy-MM-dd HH:mm:ss"),
            transactiion_status: transactionData.status,
          });
        }
      });
    } catch (error) {
      this.handleError(error, next);
    }
  }

  static async withdrawFunds(req: Request, res: Response, next: NextFunction) {
    this.checkAuth(req, next);

    const walletId = Number(req.params.wallet_id);
    const walletData = req.body;

    try {
      await this.validateWalletData(walletData, walletId, next);

      const userWalletInfo = await UserWallet.getUserWalletInfo(walletId);

      if (!userWalletInfo) {
        return next(new CustomError("Invalid wallet information", 404));
      }

      await db.transaction(async (trx) => {
        if (!isBalanceSufficient(userWalletInfo.balance, walletData.amount)) {
          const transactionData = await UserTransaction.createTransaction(
            {
              wallet_id: walletId,
              transaction_id: `TXN` + generateRandomNumber(15),
              amount: walletData.amount,
              transaction_type: "withdrawal",
              status: "failed",
            },
            trx
          );

          const createdAtDate = transactionData.created_at
            ? new Date(transactionData.created_at)
            : new Date();

          return next(
            new CustomError("Insufficient balance", 400, {
              wallet_id: userWalletInfo.wallet_id,
              available_balance: userWalletInfo.balance,
              transaction_amount: walletData.amount,
              transaction_id: transactionData.transaction_id,
              transaction_type: transactionData.transaction_type,
              transaction_date: format(createdAtDate, "yyyy-MM-dd HH:mm:ss"),
              transaction_status: transactionData.status,
            })
          );
        }

        const updatedWallet = await UserWallet.updateUserWalletBalance(
          walletId,
          walletData.amount,
          trx,
          "subtract"
        );

        if (updatedWallet) {
          const transactionData = await this.createTransactionRecord(
            walletId,
            walletData.amount,
            "withdrawal",
            "success",
            trx
          );

          res
            .status(200)
            .json(
              this.buildResponse(
                `Your withdrawal of N${walletData.amount} was successful! Your new balance is N${updatedWallet.balance}.`,
                walletId,
                updatedWallet.balance,
                walletData,
                transactionData
              )
            );
        }
      });
    } catch (error) {
      this.handleError(error, next);
    }
  }

  static async handleFailedTransaction(
    senderWalletInfo: any,
    recipientWalletInfo: any,
    amount: number,
    trx: Knex.Transaction,
    next: NextFunction
  ) {
    const transactionData = await this.createTransactionRecord(
      senderWalletInfo.wallet_id,
      amount,
      "transfer",
      "failed",
      trx,
      recipientWalletInfo.wallet_id
    );

    const createdAtDate = transactionData.created_at
      ? new Date(transactionData.created_at)
      : new Date();

    return next(
      new CustomError("Insufficient balance", 400, {
        recipient_wallet_id: recipientWalletInfo.wallet_id,
        sender_wallet_id: senderWalletInfo.wallet_id,
        sender_name: senderWalletInfo.name,
        recipient_name: recipientWalletInfo.name,
        available_balance: senderWalletInfo.balance,
        transaction_amount: amount,
        transaction_id: transactionData.transaction_id,
        transaction_type: transactionData.transaction_type,
        transaction_date: format(createdAtDate, "yyyy-MM-dd HH:mm:ss"),
        transaction_status: transactionData.status,
      })
    );
  }

  static async createTransactionRecord(
    wallet_id: number,
    amount: number,
    transaction_type: transactionType,
    status: transactionStatus,
    trx: Knex.Transaction,
    recipient_wallet_id?: number
  ) {
    return await UserTransaction.createTransaction(
      {
        wallet_id,
        recipient_wallet_id,
        transaction_id: `TXN` + generateRandomNumber(15),
        amount,
        transaction_type,
        status,
      },
      trx
    );
  }

  static async validateWalletData(
    walletData: any,
    walletId: number,
    next: NextFunction
  ) {
    const errors = await validateWalletCredentials({
      ...walletData,
      wallet_id: walletId,
    });
    if (errors.length > 0) {
      return next(new CustomError("Validation errors occurred", 400, errors));
    }
  }

  static checkAuth(req: Request, next: NextFunction) {
    if (!req.isAuth) {
      return next(new CustomError("Unauthorized access", 401));
    }
  }

  static buildResponse(
    message: string,
    walletId: number,
    balance: number,
    walletData: any,
    transactionData: any
  ) {
    const createdAtDate = transactionData.created_at
      ? new Date(transactionData.created_at)
      : new Date();

    return {
      message,
      wallet_id: walletId,
      available_balance: balance,
      transaction_amount: walletData.amount,
      transaction_id: transactionData.transaction_id,
      transaction_type: transactionData.transaction_type,
      transaction_date: format(createdAtDate, "yyyy-MM-dd HH:mm:ss"),
      transactiion_status: transactionData.status,
    };
  }

  static handleError(error: any, next: NextFunction) {
    logger.error(
      `${(error as Error).message || "Unknown error occurred"}\n${
        (error as Error).stack || "No stack trace available"
      }`
    );

    if (error instanceof CustomError) {
      return next(error);
    }

    next(
      new CustomError((error as Error).message || "Internal server error", 500)
    );
  }
}

export default WalletController;
