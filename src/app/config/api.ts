// API Configuration
const getApiBaseUrl = () => {
  // Check if we're in the browser
  if (typeof window !== 'undefined') {
    // Use production API domain when not in development
    const isProduction = 
      !window.location.hostname.includes('localhost') && 
      !window.location.hostname.includes('127.0.0.1');
    
    if (isProduction) {
      return 'https://gnoclue-api.ditmenavi.com/api';
    } else {
      // Development: Use the same host as the current page with API port
      const protocol = window.location.protocol;
      const host = window.location.hostname;
      return `${protocol}//${host}:6996/api`;
    }
  }
  
  // Fallback for server-side rendering
  return 'https://gnoclue-api.ditmenavi.com/api';
};

export const API_BASE_URL = getApiBaseUrl(); 