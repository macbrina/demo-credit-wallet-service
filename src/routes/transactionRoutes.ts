import TransactionController from "@/controllers/transactionController";
import isAuth from "@/middlewares/isAuth";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.use(isAuth);

router.get(
  "/:wallet_id/all",
  async (req: Request, res: Response, next: NextFunction) => {
    await TransactionController.getAllTransactions(req, res, next);
  }
);

router.get(
  "/:transaction_id",
  async (req: Request, res: Response, next: NextFunction) => {
    await TransactionController.getTransactionById(req, res, next);
  }
);

export default router;
