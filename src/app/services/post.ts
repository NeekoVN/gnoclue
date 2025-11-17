import axios from "axios";
import { IPost, IPostsResponse, IMediaObject } from "../types/post";
import { API_BASE_URL } from "../config/api";

const BASE_URL = `${API_BASE_URL}/posts`;
const RECOMMENDATIONS_URL = `${API_BASE_URL}/recommendations`;

// Media upload interfaces
export interface IPresignFileRequest {
  type: 'image' | 'video' | 'audio' | 'document';
  byteLength: number;
  contentType: string;
}

export interface IPresignResponse {
  items: Array<{
    type: string;
    key: string;
    putUrl: string;
    contentType: string;
  }>;
}

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

// Presign media uploads
export const presignMediaUpload = async (files: IPresignFileRequest[]): Promise<IPresignResponse> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.post<IPresignResponse>('/media/presign', { files });
  return response.data;
};

export interface ICreatePostRequest {
  content: string;
  tags?: string[];
  media?: IMediaObject[];
}

export interface IUpdatePostRequest {
  content?: string;
  tags?: string[];
  media?: IMediaObject[];
}

// Get all posts (paginated) - Original implementation
export const getAllPosts = async (page: number = 1, limit: number = 10): Promise<IPostsResponse> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<IPostsResponse>(`?page=${page}&limit=${limit}`);
  return response.data;
};

// Get personalized recommendation feed (NEW: Uses ML recommendations)
export const getPersonalizedFeed = async (
  page: number = 1, 
  limit: number = 10,
  personaId?: string
): Promise<IPostsResponse> => {
  const token = getAuthToken();
  const axiosInstance = axios.create({
    baseURL: RECOMMENDATIONS_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Add the same response interceptor for auth errors
  axiosInstance.interceptors.response.use(
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

  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  // Add persona_id if provided
  if (personaId) {
    params.append('persona_id', personaId);
  }

  const response = await axiosInstance.get<IPostsResponse>(`/feed?${params.toString()}`);
  return response.data;
};

// Main posts function - now uses personalized recommendations by default
export const getPosts = async (
  page: number = 1, 
  limit: number = 10, 
  usePersonalized: boolean = true,
  personaId?: string
): Promise<IPostsResponse> => {
  if (usePersonalized) {
    try {
      return await getPersonalizedFeed(page, limit, personaId);
    } catch (error) {
      console.warn('Failed to get personalized feed, falling back to all posts:', error);
      return await getAllPosts(page, limit);
    }
  }
  return await getAllPosts(page, limit);
};

// Get a single post by ID
export const getPost = async (postId: string): Promise<IPost> => {
  const axiosInstance = createAuthAxios();
  console.log('Fetching post with ID:', postId);
  console.log('Request URL:', `${BASE_URL}/${postId}`);
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

// Send interaction event to recommendation engine for better personalization
export const sendInteractionEvent = async (
  postId: string, 
  eventType: 'view' | 'upvote' | 'downvote' | 'comment' | 'share' | 'save',
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; message: string }> => {
  const token = getAuthToken();
  const axiosInstance = axios.create({
    baseURL: RECOMMENDATIONS_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const response = await axiosInstance.post('/events', {
    post_id: postId,
    event_type: eventType,
    metadata: metadata || {}
  });

  return response.data;
};

// Delete a post
export const deletePost = async (postId: string): Promise<void> => {
  const axiosInstance = createAuthAxios();
  await axiosInstance.delete(`/${postId}`);
};

// Get media display URL
export const getMediaUrl = async (key: string): Promise<string> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<{ getUrl: string }>(`/media/url?key=${encodeURIComponent(key)}`);
  return response.data.getUrl;
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