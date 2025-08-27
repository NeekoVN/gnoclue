import axios from "axios";
import { API_BASE_URL } from "../config/api";
import {
  CreateDirectConversationResponse,
  CreateGroupConversationResponse,
  IConversation,
  IPaginatedMessages,
  IMessage,
} from "../types/messaging";

const BASE_URL = `${API_BASE_URL}`;

const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

const createAuthAxios = () => {
  const token = getAuthToken();
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}` },
  });
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/signin"
        ) {
          window.location.href = "/signin";
        }
      }
      return Promise.reject(error);
    }
  );
  return instance;
};

export const listConversations = async (): Promise<IConversation[]> => {
  const axiosInstance = createAuthAxios();
  const { data } = await axiosInstance.get<
    IConversation[] | { conversations?: IConversation[]; items?: IConversation[] }
  >("/conversations");
  if (Array.isArray(data)) return data as IConversation[];
  const obj = data as { conversations?: IConversation[]; items?: IConversation[] };
  if (obj && Array.isArray(obj.conversations)) return obj.conversations;
  if (obj && Array.isArray(obj.items)) return obj.items;
  return [];
};

export const createDirectConversation = async (
  peerUserId: string
): Promise<CreateDirectConversationResponse> => {
  const axiosInstance = createAuthAxios();
  const { data } = await axiosInstance.post<CreateDirectConversationResponse>(
    "/conversations/direct",
    { peerUserId }
  );
  return data;
};

export const createGroupConversation = async (
  name: string,
  participantIds: string[]
): Promise<CreateGroupConversationResponse> => {
  const axiosInstance = createAuthAxios();
  const { data } = await axiosInstance.post<CreateGroupConversationResponse>(
    "/conversations/group",
    { name, participantIds }
  );
  return data;
};

export const listMessages = async (
  conversationId: string,
  page = 1,
  limit = 20
): Promise<IPaginatedMessages> => {
  const axiosInstance = createAuthAxios();
  const { data } = await axiosInstance.get<
    IPaginatedMessages | IMessage[] | { messages?: IMessage[]; page?: number; limit?: number; hasMore?: boolean }
  >(`/conversations/${conversationId}/messages?page=${page}&limit=${limit}`);
  if (Array.isArray(data)) {
    return {
      items: data as IMessage[],
      page,
      limit,
      hasMore: (data as IMessage[]).length >= limit,
    };
  }
  const obj = data as IPaginatedMessages & {
    messages?: IMessage[];
  };
  if (obj && Array.isArray((obj as IPaginatedMessages).items)) return obj as IPaginatedMessages;
  if (obj && Array.isArray(obj.messages)) {
    return {
      items: obj.messages as IMessage[],
      page: obj.page ?? page,
      limit: obj.limit ?? limit,
      hasMore: obj.hasMore ?? (obj.messages as IMessage[]).length >= limit,
    };
  }
  return { items: [], page, limit, hasMore: false };
};

export const sendMessage = async (payload: {
  conversationId: string;
  ciphertext: string;
  nonce?: string | null;
  parentMessageId?: string | null;
}): Promise<IMessage> => {
  const axiosInstance = createAuthAxios();
  const { data } = await axiosInstance.post<IMessage>("/messages", payload);
  return data;
};

export const markConversationRead = async (
  conversationId: string,
  at: string
): Promise<void> => {
  const axiosInstance = createAuthAxios();
  await axiosInstance.post(`/messages/conversations/${conversationId}/read`, {
    at,
  });
};

export interface IConversationParticipant {
  userId: string;
  role: string;
  joinedAt: string;
  lastReadAt: string | null;
}

export interface IConversationParticipantsResponse {
  participants: IConversationParticipant[];
}

export const getConversationParticipants = async (
  conversationId: string
): Promise<IConversationParticipantsResponse> => {
  const axiosInstance = createAuthAxios();
  const { data } = await axiosInstance.get<IConversationParticipantsResponse>(
    `/conversations/${conversationId}/participants`
  );
  return data;
};

// Live Events API functions
export const markMessageAsRead = async (
  messageId: string,
  conversationId: string
): Promise<void> => {
  const axiosInstance = createAuthAxios();
  await axiosInstance.post(`/messages/${messageId}/read`, {
    conversationId,
    readAt: new Date().toISOString(),
  });
};

export const markMessageAsDelivered = async (
  messageId: string,
  conversationId: string
): Promise<void> => {
  const axiosInstance = createAuthAxios();
  await axiosInstance.post(`/messages/${messageId}/delivered`, {
    conversationId,
  });
};

export const getOnlineUsers = async (): Promise<string[]> => {
  const axiosInstance = createAuthAxios();
  const { data } = await axiosInstance.get<string[]>("/users/online");
  return data;
};

export const getUnreadCounts = async (): Promise<Record<string, number>> => {
  const axiosInstance = createAuthAxios();
  const { data } = await axiosInstance.get<Record<string, number>>("/conversations/unread-counts");
  return data;
};


