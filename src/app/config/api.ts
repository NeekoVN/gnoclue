// API Configuration
const getApiBaseUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Use the same host as the current page, but with the API port
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    return `${protocol}//${host}:6996/api`;
  }
  
  // Fallback for server-side rendering
  return 'http://localhost:6996/api';
};

export const API_BASE_URL = getApiBaseUrl(); 