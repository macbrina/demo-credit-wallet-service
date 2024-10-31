import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("transactions", (table) => {
    table.increments("id").primary();
    table.string("transaction_id").notNullable();
    table
      .bigInteger("wallet_id")
      .notNullable()
      .references("wallet_id")
      .inTable("wallets")
      .onDelete("CASCADE");
    table
      .bigInteger("recipient_wallet_id")
      .nullable()
      .references("wallet_id")
      .inTable("wallets")
      .onDelete("CASCADE");
    table.decimal("amount", 10, 2).notNullable();
    table.enum("transaction_type", ["deposit", "withdrawal", "transfer"]);
    table
      .enum("status", ["pending", "failed", "success", "reversed", "scheduled"])
      .notNullable()
      .defaultTo("success");
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("transactions");
}
