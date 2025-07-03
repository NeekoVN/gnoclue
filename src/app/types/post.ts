// src/types/post.ts
import { IUser } from './user';

export interface IPost {
    _id: string;
    userId: string | IUser; // Could be just ID (string) or populated User object (IUser)
    content: string;
    images?: string[];
    tags?: string[];
    processedKeywords?: string[];
    upvotes?: string[];
    downvotes?: string[];
    commentCount?: number;
    algorithmScore?: number;
    createdAt: string;
    updatedAt: string;
}

export interface IPostsResponse {
    posts: IPost[];
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    totalPosts: number;
}