import axios from "axios";
import { IUser } from "../types/user";

const BASE_URL = "http://localhost:6996/api/auth";

// Get auth token for requests
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Create axios instance with auth header
const createAuthAxios = () => {
  const token = getAuthToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
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