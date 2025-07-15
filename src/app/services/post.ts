import axios from "axios";
import { IPost, IPostsResponse } from "../types/post";
import { API_BASE_URL } from "../config/api";

const BASE_URL = `${API_BASE_URL}/posts`;

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

export interface ICreatePostRequest {
  content: string;
  tags?: string[];
  images?: string[];
}

export interface IUpdatePostRequest {
  content?: string;
  tags?: string[];
  images?: string[];
}

// Get all posts (paginated)
export const getPosts = async (page: number = 1, limit: number = 10): Promise<IPostsResponse> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<IPostsResponse>(`?page=${page}&limit=${limit}`);
  return response.data;
};

// Get a single post by ID
export const getPost = async (postId: string): Promise<IPost> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<IPost>(`/${postId}`);
  return response.data;
};

// Create a new post
export const createPost = async (postData: ICreatePostRequest): Promise<IPost> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.post<IPost>("/", postData);
  return response.data;
};

// Update a post
export const updatePost = async (postId: string, postData: IUpdatePostRequest): Promise<IPost> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.put<IPost>(`/${postId}`, postData);
  return response.data;
};

// Delete a post
export const deletePost = async (postId: string): Promise<void> => {
  const axiosInstance = createAuthAxios();
  await axiosInstance.delete(`/${postId}`);
};

// Like/upvote a post
export const upvotePost = async (postId: string): Promise<IPost> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.put<IPost>(`/${postId}/upvote`);
  return response.data;
};

// Unlike/downvote a post
export const downvotePost = async (postId: string): Promise<IPost> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.put<IPost>(`/${postId}/downvote`);
  return response.data;
}; 