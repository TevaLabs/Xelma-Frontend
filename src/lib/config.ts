/**
 * Unified application configuration helper.
 * Resolves and normalizes the backend/API server URLs from environment variables.
 */

// Get backend base URL from env (canonical: VITE_API_BASE_URL)
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Normalize the backend URL by removing trailing /api segment and any trailing slashes.
// This guarantees a clean root URL like "http://localhost:3000" or "https://xelma-backend.onrender.com".
export const BACKEND_BASE_URL = rawBaseUrl.replace(/\/api\/?$/i, '').replace(/\/+$/, '');

// Export canonical URLs for REST APIs and Socket.IO connections.
export const API_BASE_URL = BACKEND_BASE_URL;
export const SOCKET_URL = BACKEND_BASE_URL;
