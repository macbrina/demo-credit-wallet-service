import WalletController from "@/controllers/walletController";
import isAuth from "@/middlewares/isAuth";
import { NextFunction, Request, Response, Router } from "express";

const router = Router();

router.post(
  "/:wallet_id/deposit",
  isAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    await WalletController.depositFunds(req, res, next);
  }
);

export default router;
