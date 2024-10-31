import { Knex } from "knex";
import db from "../../db";

type transactionType = "deposit" | "withdrawal" | "transfer";
type transactionStatus =
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
    const [transaction_id] = await trx("transactions").insert(transactionData);
    const insertedTransaction = await trx("transactions")
      .select("*")
      .where("id", transaction_id)
      .first();

    return insertedTransaction;
  }

  static async findTransactionById(
    transaction_id: string
  ): Promise<transactionData | null> {
    const transaction = await db<transactionData>("transactions")
      .where(transaction_id)
      .first();

    return transaction ? transaction : null;
  }
}

export default UserTransaction;
