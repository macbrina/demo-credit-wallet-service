import { CustomError } from "@/errors/customError";
import UserTransaction from "@/models/transactionModel";
import UserWallet from "@/models/walletModel";
import logger from "@/utils/logger";
import { endOfDay, format, isValid, parseISO, startOfDay } from "date-fns";
import { NextFunction, Request, Response } from "express";

class TransactionController {
  static async getAllTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!this.checkAuth(req, next)) return;

    const walletId = req.params.wallet_id;

    const orderBy = (req.query.order_by as string) || "created_at";
    const limit = Number(req.query.limit) || 20;
    const orderDirection = (req.query.order_direction as string) || "DESC";
    const transaction_type = (req.query.type as string) || null;
    const transaction_status = (req.query.status as string) || null;
    const transaction_date_start = (req.query.date_start as string) || null;
    const transaction_date_end = (req.query.date_end as string) || null;

    const whereConditions: any = {
      wallet_id: walletId,
      ...(transaction_type && { transaction_type }),
      ...(transaction_status && { status: transaction_status }),
    };

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (transaction_date_start) {
      const dateStart = parseISO(transaction_date_start);

      if (isValid(dateStart)) {
        startDate = startOfDay(dateStart);
      }
    }

    if (transaction_date_end) {
      const dateEnd = parseISO(transaction_date_end);

      if (isValid(dateEnd)) {
        endDate = endOfDay(dateEnd);
      }
    }

    try {
      const userTransactions = await UserTransaction.getAllTransactions({
        where: whereConditions,
        limit,
        order: [[orderBy, orderDirection]],
        startDate,
        endDate,
      });

      if (!userTransactions || userTransactions.length === 0) {
        return res.status(200).json({
          message: "No transactions found for the specified criteria.",
        });
      }

      res.status(200).json({ data: userTransactions });
    } catch (error) {
      return this.handleError(error, next);
    }
  }

  static async getTransactionById(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    if (!this.checkAuth(req, next)) return;

    const transactionId = req.params.transaction_id;

    try {
      const transactionData = await UserTransaction.getTransactionById(
        transactionId
      );

      if (!transactionData) {
        return next(new CustomError("Transaction not found", 404));
      }

      let senderWalletInfo;
      let recipientWalletInfo;

      if (transactionData?.recipient_wallet_id) {
        [senderWalletInfo, recipientWalletInfo] = await Promise.all([
          UserWallet.getUserWalletInfo(transactionData.wallet_id),
          UserWallet.getUserWalletInfo(transactionData.recipient_wallet_id),
        ]);
      } else {
        senderWalletInfo = await UserWallet.getUserWalletInfo(
          transactionData.wallet_id
        );
      }

      if (!senderWalletInfo) {
        return next(
          new CustomError("Sender wallet information not found", 404)
        );
      }

      const createdAtDate = transactionData.created_at
        ? new Date(transactionData.created_at)
        : new Date();

      const responseData = {
        sender_wallet_id: senderWalletInfo.wallet_id,
        sender_name: senderWalletInfo.name,
        transaction_id: transactionData.transaction_id,
        transaction_amount: transactionData.amount,
        transaction_type: transactionData.transaction_type,
        transaction_date: format(
          new Date(createdAtDate),
          "yyyy-MM-dd HH:mm:ss"
        ),
        transaction_status: transactionData.status,
        ...(recipientWalletInfo && {
          recipient_wallet_id: recipientWalletInfo.wallet_id,
          recipient_name: recipientWalletInfo.name,
        }),
      };

      res.status(200).json({ data: responseData });
    } catch (error) {
      return this.handleError(error, next);
    }
  }

  static checkAuth(req: Request, next: NextFunction): boolean {
    if (!req.isAuth) {
      next(new CustomError("Unauthorized access", 401));
      return false;
    }

    return true;
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

export default TransactionController;
