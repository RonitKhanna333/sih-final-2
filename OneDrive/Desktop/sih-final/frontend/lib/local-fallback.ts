/**
 * Local fallback storage for development when database is unavailable
 * Shared across API routes to maintain consistency
 */

// In-memory storage for local development
export const localUsers = new Map<string, unknown>();
export const localFeedbacks = new Map<string, unknown>();
export const localPolicies = new Map<string, unknown>();

// Demo data for testing
export function initializeDemoData() {
  // This will be called to set up demo data if needed
  console.log('Local fallback storage initialized');
}