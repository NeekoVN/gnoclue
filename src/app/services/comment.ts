// src/services/comment.ts
import { IComment, ICommentsResponse } from '../types/comment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

// Get headers with auth token
const getAuthHeaders = (): HeadersInit => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Create a new comment
export const createComment = async (
  postId: string,
  content: string,
  parentId?: string
): Promise<IComment> => {
  const response = await fetch(`${API_BASE_URL}/comments`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ postId, content, parentId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create comment');
  }

  return response.json();
};

// Get comments for a post
export const getCommentsByPost = async (
  postId: string,
  page: number = 1,
  limit: number = 20
): Promise<ICommentsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/comments/post/${postId}?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch comments');
  }

  return response.json();
};

// Get replies to a comment
export const getRepliesByComment = async (
  commentId: string,
  page: number = 1,
  limit: number = 20
): Promise<ICommentsResponse> => {
  const response = await fetch(
    `${API_BASE_URL}/comments/${commentId}/replies?page=${page}&limit=${limit}`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch replies');
  }

  return response.json();
};

// Update a comment
export const updateComment = async (
  commentId: string,
  content: string
): Promise<IComment> => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update comment');
  }

  return response.json();
};

// Delete a comment (soft delete)
export const deleteComment = async (commentId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete comment');
  }
};

// Upvote a comment
export const upvoteComment = async (commentId: string): Promise<IComment> => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}/upvote`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to upvote comment');
  }

  return response.json();
};

// Downvote a comment
export const downvoteComment = async (commentId: string): Promise<IComment> => {
  const response = await fetch(`${API_BASE_URL}/comments/${commentId}/downvote`, {
    method: 'PUT',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to downvote comment');
  }

  return response.json();
};
