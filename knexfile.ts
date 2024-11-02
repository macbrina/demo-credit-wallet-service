import { Knex } from "knex";
import "dotenv/config";

const config: Knex.Config = {
  client: "mysql2",
  connection:
    process.env.NODE_ENV === "development"
      ? {
          host: process.env.DB_HOST,
          port: process.env.DB_PORT
            ? parseInt(process.env.DB_PORT, 10)
            : undefined,
          user: process.env.DB_USER,
          password: process.env.DB_PASS,
          database: process.env.DB_NAME,
        }
      : process.env.JAWSDB_URL,
  migrations: {
    directory: "./src/migrations",
    tableName: "knex_migrations",
  },
  seeds: {
    directory: "./src/seeds",
  },
};

export default config;
