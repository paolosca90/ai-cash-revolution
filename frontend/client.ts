import { apiClient } from "./lib/api-client";

// Export the apiClient as the default export to maintain compatibility
export default apiClient;

// Also export it as a named export
export { apiClient };

// Export types that might be needed
export type { MT5Config, MT5Status } from "./hooks/useMT5Connection";