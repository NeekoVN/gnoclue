import axios from "axios";
import { IUser } from "../types/user";
import { API_BASE_URL } from "../config/api";

const BASE_URL = `${API_BASE_URL}/auth`;

// Get auth token for requests
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Create axios instance with auth header
const createAuthAxios = () => {
  const token = getAuthToken();
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Add response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        if (typeof window !== "undefined" && window.location.pathname !== "/signin") {
          window.location.href = "/signin";
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// Get current user profile
export const getCurrentUser = async (): Promise<IUser> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<IUser>("/me");
  return response.data;
};

// Get user by ID
export const getUserById = async (userId: string): Promise<IUser> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<IUser>(`/${userId}`);
  return response.data;
}; 