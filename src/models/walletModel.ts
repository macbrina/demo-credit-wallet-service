import { Knex } from "knex";
import db from "../../db";

interface userWalletData {
  user_id: number;
  wallet_id: number;
  balance?: number;
  created_at?: Date;
  updated_at?: Date;
}

class UserWallet {
  user_id: number;
  wallet_id: number;
  balance?: number;
  created_at?: Date;
  updated_at?: Date;

  constructor({
    user_id,
    wallet_id,
    balance,
    created_at,
    updated_at,
  }: userWalletData) {
    this.user_id = user_id;
    this.wallet_id = wallet_id;
    this.balance = balance;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async createUserWallet(
    userWalletData: userWalletData,
    trx: Knex.Transaction
  ): Promise<number> {
    const [newUserWalletId] = await trx("wallets").insert(userWalletData);

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
      walletId = Math.floor(1000000000 + Math.random() * 9000000000);
      const countResult = await db("wallets")
        .where({ wallet_id: walletId })
        .count();
      exists = Number(countResult[0].count) > 0;
    } while (exists);

    return walletId;
  }
}

export default UserWallet;
