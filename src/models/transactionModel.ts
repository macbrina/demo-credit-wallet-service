import { Knex } from "knex";
import db from "../../db";

export type transactionType = "deposit" | "withdrawal" | "transfer";
export type transactionStatus =
  | "pending"
  | "failed"
  | "success"
  | "reversed"
  | "scheduled";

interface transactionData {
  wallet_id: number;
  transaction_id: string;
  recipient_wallet_id?: number;
  amount: number;
  transaction_type: transactionType;
  status: transactionStatus;
  created_at?: Date;
  updated_at?: Date;
}

class UserTransaction {
  wallet_id: number;
  transaction_id: string;
  amount: number;
  transaction_type: transactionType;
  recipient_wallet_id?: number;
  status: transactionStatus;
  created_at?: Date;
  updated_at?: Date;

  constructor({
    wallet_id,
    transaction_id,
    amount,
    transaction_type,
    recipient_wallet_id,
    status,
    created_at,
    updated_at,
  }: transactionData) {
    this.wallet_id = wallet_id;
    this.transaction_id = transaction_id;
    this.amount = amount;
    this.transaction_type = transaction_type;
    this.recipient_wallet_id = recipient_wallet_id;
    this.status = status;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }

  static async createTransaction(
    transactionData: transactionData,
    trx: Knex.Transaction
  ): Promise<transactionData> {
    try {
      const [transaction_id] = await trx("transactions").insert(
        transactionData
      );
      const insertedTransaction = await trx("transactions")
        .select("*")
        .where("id", transaction_id)
        .first();

      return insertedTransaction;
    } catch (error) {
      throw new Error("Failed to create transaction.");
    }
  }

  static async getTransactionById(
    transaction_id: string
  ): Promise<transactionData | null> {
    try {
      const transaction = await db<transactionData>("transactions")
        .where({ transaction_id })
        .first();

      return transaction ? transaction : null;
    } catch (error) {
      throw new Error("Failed to find transaction by ID.");
    }
  }

  static async getAllTransactions(options?: {
    where: any;
    limit?: number;
    order?: any[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<
    | {
        id: number;
        transaction_id: string;
        amount: number;
        transaction_type: string;
        status: string;
        created_at: Date;
      }[]
    | null
  > {
    try {
      const query = db<transactionData>("transactions").where(options?.where);

      if (options?.startDate && options?.endDate) {
        query.whereBetween("created_at", [options.startDate, options.endDate]);
      } else if (options?.startDate) {
        query.where("created_at", ">=", options.startDate);
      } else if (options?.endDate) {
        query.where("created_at", "<=", options.endDate);
      }

      if (options?.order) {
        options.order.forEach((order) => {
          query.orderBy(order[0], order[1]);
        });
      }

      if (options?.limit) {
        query.limit(options.limit);
      }

      const transactions = await query.select(
        "id",
        "transaction_id",
        "amount",
        "transaction_type",
        "status",
        "created_at"
      );
      return transactions.length > 0 ? transactions : null;
    } catch (error) {
      throw new Error("Failed to retrieve all transactions.");
    }
  }
}

export default UserTransaction;
