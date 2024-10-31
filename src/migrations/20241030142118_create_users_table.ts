import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("email").unique().notNullable();
    table.string("password").notNullable();
    table.string("phone_number", 14).notNullable();
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.table("wallets", (table) => {
    table.dropForeign(["user_id"]);
  });
  await knex.schema.dropTableIfExists("users");
}
