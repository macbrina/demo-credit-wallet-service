import { Knex } from "knex";
import "dotenv/config";

const config: Knex.Config = {
  client: "mysql2",
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  },
  migrations: {
    directory: "./src/migrations",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./src/seeds",
  },
};

export default config;
