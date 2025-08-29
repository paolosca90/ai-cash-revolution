// Database client for data_enrichment service
import { SQLDatabase } from "encore.dev/storage/sqldb";

// Create a database client for this service
export const dataEnrichmentDB = new SQLDatabase("data_enrichment", {
  migrations: "./migrations"
});