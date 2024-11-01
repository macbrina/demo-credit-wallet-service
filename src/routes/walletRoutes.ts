import WalletController from "@/controllers/walletController";
import isAuth from "@/middlewares/isAuth";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.use(isAuth);

router.get(
  "/:wallet_id/balance",
  async (req: Request, res: Response, next: NextFunction) => {
    await WalletController.getUserBalance(req, res, next);
  }
);

router.post(
  "/:wallet_id/deposit",
  async (req: Request, res: Response, next: NextFunction) => {
    await WalletController.depositFunds(req, res, next);
  }
);

router.post(
  "/:wallet_id/transfer",
  async (req: Request, res: Response, next: NextFunction) => {
    await WalletController.transferFunds(req, res, next);
  }
);

router.post(
  "/:wallet_id/withdraw",
  async (req: Request, res: Response, next: NextFunction) => {
    await WalletController.withdrawFunds(req, res, next);
  }
);

export default router;
