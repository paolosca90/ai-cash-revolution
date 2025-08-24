import { SQLDatabase } from "encore.dev/storage/sqldb";

export const billingDB = new SQLDatabase("billing", {
  migrations: "./migrations",
});