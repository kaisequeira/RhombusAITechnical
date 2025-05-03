// Backend API URL
export const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// API endpoints
export const API_ENDPOINTS = {
  UPLOAD: `${BACKEND_URL}/api/upload/`,
  FILES: `${BACKEND_URL}/api/files/`,
  OVERRIDE: (fileId: string) => `${BACKEND_URL}/api/files/${fileId}/override/`,
  DOWNLOAD: (fileId: string) => `${BACKEND_URL}/api/files/${fileId}/download/`,
  DELETE: (fileId: string) => `${BACKEND_URL}/api/files/${fileId}/delete/`,
};
