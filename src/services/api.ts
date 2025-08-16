// Re-export the centralized API client for backward compatibility
// This ensures all files using the old api.ts get the new enhanced apiClient
import apiClient, { api } from './apiClient';

export default api;
export { apiClient };