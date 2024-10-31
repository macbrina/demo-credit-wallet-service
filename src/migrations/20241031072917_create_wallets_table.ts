import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("wallets", (table) => {
    table.increments("id").primary();
    table
      .integer("user_id")
      .unsigned()
      .notNullable()
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table.bigInteger("wallet_id").notNullable().unique();
    table.string("wallet_pin").notNullable();
    table.decimal("balance", 10, 2).notNullable().defaultTo(0.0);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("wallets");
}
