import axios from "axios";
import { IUser, IUserPublic } from "../types/user";
import { API_BASE_URL } from "../config/api";

const AUTH_BASE_URL = `${API_BASE_URL}/auth`;
const USERS_BASE_URL = `${API_BASE_URL}/users`;

// Get auth token for requests
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Create axios instance with auth header
const createAuthAxios = () => {
  const token = getAuthToken();
  const instance = axios.create({
    baseURL: AUTH_BASE_URL,
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

// Public user by ID
export const getPublicUserById = async (userId: string): Promise<IUserPublic> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await axios.get<IUserPublic>(`${USERS_BASE_URL}/${userId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

// User's posts (paginated)
export interface IUserPostsResponse<TPost> {
  posts: TPost[];
  page: number;
  total: number;
  hasMore: boolean;
}

export const getUserPosts = async <TPost = unknown>(
  userId: string,
  page = 1,
  limit = 10
): Promise<IUserPostsResponse<TPost>> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await axios.get<IUserPostsResponse<TPost>>(
    `${USERS_BASE_URL}/${userId}/posts?page=${page}&limit=${limit}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

// Follow / Unfollow
export const followUser = async (userId: string): Promise<{ ok: boolean; targetFollowers: number }> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await axios.post<{ ok: boolean; targetFollowers: number }>(
    `${USERS_BASE_URL}/${userId}/follow`,
    {},
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};

export const unfollowUser = async (userId: string): Promise<{ ok: boolean; targetFollowers: number }> => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await axios.delete<{ ok: boolean; targetFollowers: number }>(
    `${USERS_BASE_URL}/${userId}/follow`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return res.data;
};