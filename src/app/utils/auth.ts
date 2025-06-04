export const AUTH_COOKIE = 'auth_token';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    username: string;
  };
}

interface RegisterResponse {
  msg: string;
  user: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  console.log("Making login request to:", 'http://localhost:6996/api/login');
  console.log("Request body:", { email, password });

  const response = await fetch('http://localhost:6996/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  console.log("Response status:", response.status);
  
  if (!response.ok) {
    console.error("Login request failed with status:", response.status);
    throw new Error('Login failed');
  }

  const data = await response.json();
  console.log("Login response:", data);
  return data;
}

export async function register(email: string, username: string, password: string): Promise<RegisterResponse> {
  console.log("Auth: Sending registration request to:", "http://localhost:6996/api/register");
  console.log("Auth: Request body:", { email, username, password });

  const response = await fetch("http://localhost:6996/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, username, password }),
  });

  console.log("Auth: Registration response status:", response.status);
  const data = await response.json();
  console.log("Auth: Registration response data:", data);

  if (!response.ok) {
    throw new Error(data.msg || data.error || "Registration failed");
  }

  return data;
}

export function setAuthCookie(token: string) {
  console.log("Setting auth cookie with token:", token);
  // Set cookie with max-age of 7 days
  document.cookie = `${AUTH_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; secure; samesite=lax`;
}

export function getAuthCookie() {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith(`${AUTH_COOKIE}=`));
  const token = authCookie ? authCookie.split('=')[1] : null;
  console.log("Getting auth cookie:", token);
  return token;
}

export function removeAuthCookie() {
  console.log("Removing auth cookie");
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; secure; samesite=lax`;
} 