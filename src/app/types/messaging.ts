// Messaging domain types

export type ConversationType = "direct" | "group";

export interface IConversation {
  _id: string;
  type: ConversationType;
  name?: string;
  participantIds?: string[]; // Made optional to handle cases where it might be undefined
  lastMessageAt?: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IMessageAttachment {
  id: string;
  type: "image" | "file";
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  parentMessageId?: string | null;
  ciphertext: string; // E2E ciphertext
  nonce?: string | null;
  plaintext?: string | null;
  attachments: IMessageAttachment[];
  createdAt: string;
  // Read receipt fields
  readBy?: string[]; // Array of user IDs who have read this message
  deliveredTo?: string[]; // Array of user IDs who have received this message
}

export interface IPaginatedMessages {
  items: IMessage[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateDirectConversationResponse {
  conversationId: string;
}

export interface CreateGroupConversationResponse {
  conversationId: string;
}

// Live Events Types
export interface ITypingIndicator {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: number;
}

export interface IOnlineStatus {
  userId: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface IReadReceipt {
  messageId: string;
  conversationId: string;
  userId: string;
  readAt: string;
}

export interface IUnreadCount {
  conversationId: string;
  count: number;
  lastMessageId?: string;
}

// Socket event types
export interface SocketEvents {
  // Typing indicators
  'typing:start': (data: { conversationId: string; userId: string; username: string }) => void;
  'typing:stop': (data: { conversationId: string; userId: string }) => void;
  
  // Online status
  'user:online': (data: { userId: string; lastSeen?: string }) => void;
  'user:offline': (data: { userId: string; lastSeen: string }) => void;
  
  // Read receipts
  'message:read': (data: IReadReceipt) => void;
  'message:delivered': (data: { messageId: string; conversationId: string; userId: string }) => void;
  
  // Unread counts
  'unread:update': (data: IUnreadCount) => void;
  
  // Conversation events
  'conversation:join': (data: { conversationId: string; userId: string }) => void;
  'conversation:leave': (data: { conversationId: string; userId: string }) => void;
}


