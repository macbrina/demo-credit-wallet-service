import { NextFunction, Request, Response } from "express";
import User from "@/models/userModel";
import UserWallet from "@/models/walletModel";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "@/utils/logger";
import db from "../../db";
import {
  validateUserCreationInput,
  checkUserKarma,
  validateUserLoginInput,
} from "@/utils/validation";
import { CustomError } from "@/errors/customError";

class UserController {
  static async createUser(req: Request, res: Response, next: NextFunction) {
    const userData = req.body;

    try {
      const errors = await validateUserCreationInput(userData);

      if (errors.length > 0) {
        return next(new CustomError("Validation errors occurred", 400, errors));
      }

      let userKarma;

      if (userData?.identity) {
        userKarma = await checkUserKarma(userData.identity); // For testing purposes
      } else {
        userKarma = await checkUserKarma(userData.email);
      }

      if (userKarma) {
        return next(
          new CustomError("Access denied: Insufficient karma score", 403)
        );
      }

      const { wallet_pin, identity, ...newUserData } = userData;

      await db.transaction(async (trx) => {
        const newUserId = await User.createUser(newUserData, trx);

        const walletId = await UserWallet.generateUniqueWalletId();

        const newWallet = {
          user_id: newUserId,
          wallet_id: walletId,
          wallet_pin: userData.wallet_pin,
        };

        await UserWallet.createUserWallet(newWallet, trx);
        res
          .status(201)
          .json({ message: "User created successfully", walletId: walletId });
      });
    } catch (error) {
      return this.handleError(error, next);
    }
  }

  static async loginUser(req: Request, res: Response, next: NextFunction) {
    const userData = req.body;

    const errors = validateUserLoginInput(userData);

    if (errors.length > 0) {
      return next(new CustomError("Validation errors occurred", 400, errors));
    }

    try {
      let userKarma;

      // if (userData?.identity) {
      //   userKarma = await checkUserKarma(userData.identity); // For testing purposes
      // } else {
      //   userKarma = await checkUserKarma(userData.email);
      // }

      // if (userKarma) {
      //   return next(
      //     new CustomError("Access denied: Insufficient karma score", 403)
      //   );
      // }

      const existingUser = await User.findUserByEmail(userData.email);
      if (!existingUser) {
        return next(new CustomError("Invalid email or password", 401));
      }

      const passwordMatch = await bcrypt.compare(
        userData.password,
        existingUser.password
      );

      if (!passwordMatch) {
        return next(new CustomError("Invalid email or password", 401));
      }

      const token = jwt.sign(
        { userId: existingUser.id },
        process.env.JWT_SECRET_KEY!,
        { expiresIn: "1h" }
      );
      return res.status(200).json({ token });
    } catch (error) {
      return this.handleError(error, next);
    }
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

export default UserController;
