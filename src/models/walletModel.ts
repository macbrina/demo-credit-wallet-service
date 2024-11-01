import { generateRandomNumber } from "@/utils/helper";
import bcrypt from "bcrypt";
import { Knex } from "knex";
import db from "../../db";
import User from "./userModel";

interface userWalletData {
  user_id: number;
  wallet_id: number;
  wallet_pin: string;
  balance?: number;
  created_at?: Date;
  updated_at?: Date;
}

class UserWallet {
  user_id: number;
  wallet_id: number;
  wallet_pin: string;
  balance?: number;
  created_at?: Date;
  updated_at?: Date;

  constructor({
    user_id,
    wallet_id,
    wallet_pin,
    balance,
    created_at,
    updated_at,
  }: userWalletData) {
    this.user_id = user_id;
    this.wallet_id = wallet_id;
    this.wallet_pin = wallet_pin;
    this.balance = balance;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async createUserWallet(
    userWalletData: userWalletData,
    trx: Knex.Transaction
  ): Promise<number> {
    try {
      const hashedPin = await bcrypt.hash(userWalletData.wallet_pin, 10);
      const [newUserWalletId] = await trx("wallets").insert({
        ...userWalletData,
        wallet_pin: hashedPin,
      });
      const insertedWallet = await trx("wallets")
        .select("wallet_id")
        .where("id", newUserWalletId)
        .first();

      return insertedWallet.wallet_id;
    } catch (error) {
      throw new Error("Failed to create user wallet.");
    }
  }

  static async generateUniqueWalletId(): Promise<number> {
    let walletId: number;
    let exists: boolean;

    try {
      do {
        walletId = generateRandomNumber(10);
        const countResult = await db("wallets")
          .where({ wallet_id: walletId })
          .count();
        exists = Number(countResult[0].count) > 0;
      } while (exists);

      return walletId;
    } catch (error) {
      throw new Error("Failed to generate unique wallet ID.");
    }
  }

  static async findUserWalletById(
    wallet_id?: number,
    user_id?: number
  ): Promise<userWalletData | null> {
    try {
      const query = db<userWalletData>("wallets");

      if (wallet_id) {
        const wallet = await query.where({ wallet_id }).first();
        return wallet ?? null;
      } else if (user_id) {
        const wallet = await query.where({ user_id }).first();
        return wallet ?? null;
      }

      return null;
    } catch (error) {
      throw new Error("Failed to retrieve wallet information.");
    }
  }

  static async updateUserWalletBalance(
    wallet_id: number,
    amount: number,
    trx: Knex.Transaction,
    operation: "add" | "subtract"
  ): Promise<{ balance: number } | null> {
    try {
      const operator = operation === "add" ? "+" : "-";

      const updatedRows = await trx("wallets")
        .where({ wallet_id })
        .update({ balance: db.raw(`balance ${operator} ?`, [amount]) });

      if (updatedRows === 0) {
        return null;
      }

      const updatedWallet = await trx("wallets")
        .select("wallet_id", "balance")
        .where({ wallet_id })
        .first();

      return updatedWallet.balance
        ? {
            balance: updatedWallet.balance,
          }
        : null;
    } catch (error) {
      throw new Error("Failed to update wallet balance.");
    }
  }

  static async getUserWalletInfo(
    wallet_id?: number,
    user_id?: number
  ): Promise<{ balance: number; wallet_id: number; name: string } | null> {
    try {
      const query = db<userWalletData>("wallets");

      let wallet: userWalletData | undefined;

      if (wallet_id) {
        wallet = await query.where({ wallet_id }).first();
      } else if (user_id) {
        wallet = await query.where({ user_id }).first();
      }

      if (wallet) {
        const user = await User.findUserById(wallet.user_id);
        const name = user?.name || "Unknown";

        return {
          balance: wallet.balance ?? 0,
          wallet_id: wallet.wallet_id,
          name,
        };
      }

      return null;
    } catch (error) {
      throw new Error("Failed to retrieve user wallet information.");
    }
  }

  static async processWalletTransfer(
    user_wallet_id: number,
    recipient_wallet_id: number,
    amount: number,
    trx: Knex.Transaction
  ): Promise<{ balance: number } | null> {
    try {
      const updatedSenderRows = await trx("wallets")
        .where({
          wallet_id: user_wallet_id,
        })
        .update({ balance: db.raw("balance - ?", [amount]) });

      const updatedRecipientRows = await trx("wallets")
        .where({ wallet_id: recipient_wallet_id })
        .update({ balance: db.raw("balance + ?", [amount]) });

      if (updatedSenderRows === 0 || updatedRecipientRows === 0) {
        return null;
      }

      const updatedSenderWallet = await trx("wallets")
        .select("balance")
        .where({ wallet_id: user_wallet_id })
        .first();

      return updatedSenderWallet
        ? {
            balance: updatedSenderWallet.balance,
          }
        : null;
    } catch (error) {
      throw new Error("Failed to process wallet transfer.");
    }
  }
}

export default UserWallet;
