import { Service } from "encore.dev/service";

// Define the admin service
export default new Service("admin", {
  // Optional service configuration can go here
});

// Import and export the API endpoints
export * from "./api";