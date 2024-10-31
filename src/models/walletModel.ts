import { generateRandomNumber } from "@/utils/helper";
import bcrypt from "bcrypt";
import { Knex } from "knex";
import db from "../../db";

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
  }

  static async generateUniqueWalletId(): Promise<number> {
    let walletId: number;
    let exists: boolean;

    do {
      walletId = generateRandomNumber(10);
      const countResult = await db("wallets")
        .where({ wallet_id: walletId })
        .count();
      exists = Number(countResult[0].count) > 0;
    } while (exists);

    return walletId;
  }

  static async findUserWalletById(
    wallet_id: number
  ): Promise<userWalletData | null> {
    const userWallet = await db<userWalletData>("wallets")
      .where({ wallet_id })
      .first();

    return userWallet ? userWallet : null;
  }

  static async updateUserWalletBalance(
    wallet_id: number,
    amount: number,
    trx: Knex.Transaction
  ): Promise<{ balance: number } | null> {
    const updatedRows = await trx("wallets")
      .where({ wallet_id })
      .update({ balance: db.raw("balance +?", [amount]) });

    if (updatedRows === 0) {
      return null;
    }

    const updatedWallet = await trx("wallets")
      .select("wallet_id", "balance")
      .where({ wallet_id })
      .first();

    return updatedWallet
      ? {
          balance: updatedWallet.balance,
        }
      : null;
  }

  static async getUserBalance(wallet_id: number): Promise<number> {
    const userWallet = await db<userWalletData>("wallets")
      .select("balance")
      .where({ wallet_id })
      .first();

    return userWallet?.balance || 0;
  }
}

export default UserWallet;
