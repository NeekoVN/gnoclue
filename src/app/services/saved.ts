import axios from "axios";
import { IPost } from "../types/post";
import { API_BASE_URL } from "../config/api";

const BASE_URL = `${API_BASE_URL}/saved`;

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

export interface ISavedPostsResponse {
  posts: IPost[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Get all saved posts (paginated)
export const getSavedPosts = async (page: number = 1, limit: number = 10): Promise<ISavedPostsResponse> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<ISavedPostsResponse>(`?page=${page}&limit=${limit}`);
  return response.data;
};

// Toggle save/unsave a post
export const toggleSavePost = async (postId: string): Promise<{ message: string; isSaved: boolean }> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.post<{ message: string; isSaved: boolean }>(`/${postId}`);
  return response.data;
};

// Check if a post is saved
export const checkIfSaved = async (postId: string): Promise<{ isSaved: boolean }> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<{ isSaved: boolean }>(`/check/${postId}`);
  return response.data;
};

// Unsave a post
export const unsavePost = async (postId: string): Promise<{ message: string }> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.delete<{ message: string }>(`/${postId}`);
  return response.data;
};
