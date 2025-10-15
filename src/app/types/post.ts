// src/types/post.ts
import { IUser } from './user';

export interface IMediaObject {
  type: 'image' | 'video' | 'audio' | 'document';
  key: string;
  contentType: string;
  byteLength: number;
  metadata?: Record<string, unknown>;
}

export interface IPost {
    _id: string;
    userId: string | IUser; // Could be just ID (string) or populated User object (IUser)
    content: string;
    media?: IMediaObject[];
    tags?: string[];
    processedKeywords?: string[];
    upvotes?: string[];
    downvotes?: string[];
    commentCount?: number;
    algorithmScore?: number;
    createdAt: string;
    updatedAt: string;
    // Recommendation-specific fields (when coming from personalized feed)
    item_id?: string;
    score?: number;
    reason?: string;
    rec_score?: number;
    rec_reason?: string;
    diagnostics?: Record<string, unknown>;
}

export interface IPostsResponse {
    posts: IPost[];
    currentPage: number;
    totalPages: number;
    hasMore: boolean;
    totalPosts: number;
    // Recommendation metadata (when using personalized feed)
    isPersonalized?: boolean;
    total_candidates?: number;
    persona_used?: string;
    processing_time_ms?: number;
    cache_hit?: boolean;
}