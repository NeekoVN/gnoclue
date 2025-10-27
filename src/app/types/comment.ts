// src/types/comment.ts
import { IUser } from './user';

export interface IComment {
    _id: string;
    postId: string; // Reference to the post
    userId: string | IUser | null; // Could be just ID (string), populated User object (IUser), or null if user was deleted
    content: string;
    parentId?: string | null; // For nested replies - references another comment
    upvotes?: string[]; // Array of user IDs who upvoted
    downvotes?: string[]; // Array of user IDs who downvoted
    isDeleted?: boolean; // Soft delete flag
    createdAt: string;
    updatedAt: string;
}

export interface ICommentsResponse {
    comments: IComment[];
    total: number;
}
