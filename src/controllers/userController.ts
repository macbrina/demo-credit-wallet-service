import { Request, Response } from "express";
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

class UserController {
  static async createUser(req: Request, res: Response) {
    const userData = req.body;

    if (!userData || typeof userData !== "object") {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const errors = await validateUserCreationInput(userData);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const trx = await db.transaction();

    try {
      const userKarma = await checkUserKarma(userData.email);

      if (userKarma) {
        return res
          .status(403)
          .json({ message: "Access denied: Insufficient karma score" });
      }

      const newUserId = await User.createUser(userData, trx);

      const walletId = await UserWallet.generateUniqueWalletId();

      const newWallet = {
        user_id: newUserId,
        wallet_id: walletId,
      };

      await UserWallet.createUserWallet(newWallet, trx);
      await trx.commit();
      res.status(201).json({ message: "User created successfully" });
    } catch (error) {
      await trx.rollback();
      logger.error(
        (error as Error).message || "Error in user creation process"
      );
      res
        .status(500)
        .json({ message: "An error occurred during user creation" });
    }
  }

  static async loginUser(req: Request, res: Response) {
    const userData = req.body;

    if (!userData || typeof userData !== "object") {
      return res.status(400).json({ message: "Invalid request body" });
    }

    const errors = validateUserLoginInput(userData);

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    try {
      const userKarma = await checkUserKarma(userData.email);

      if (userKarma) {
        return res
          .status(403)
          .json({ message: "Access denied: Insufficient karma score" });
      }

      const existingUser = await User.findUserByEmail(userData.email);
      if (!existingUser) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const passwordMatch = await bcrypt.compare(
        userData.password,
        existingUser.password
      );

      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = jwt.sign(
        { userId: existingUser.id },
        process.env.JWT_SECRET_KEY!,
        { expiresIn: "1h" }
      );
      return res.status(200).json({ token });
    } catch (error) {
      logger.error((error as Error).message || "Error in user login process");
      res.status(500).json({ message: "An error occurred during user login" });
    }
  }
}

export default UserController;
