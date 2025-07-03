// src/types/filter.ts

export interface ICustomFilter {
    _id: string;
    name: string;
    description?: string;
    keywords?: string[];
    weights?: {
        recency?: number;
        upvotes?: number;
        comments?: number;
        followedUsers?: number;
        // ... other factors
    };
    // Mongoose Map<string, number> converts to a plain JavaScript object in JSON
    // where keys are strings and values are numbers.
    learnedKeywordWeights?: Record<string, number>;
    learnFromInteractions?: boolean;
    isSystemDefault?: boolean;
    isCopied?: boolean;
    originalCommunityFilterId?: string; // Assumes ID is a string if not populated
}

export interface ICommunityFilter {
    _id: string;
    name: string;
    description: string;
    keywords: string[];
    weights: {
        recency: number;
        upvotes: number;
        comments: number;
        followedUsers: number;
    };
    creatorId: string; // The ID of the user who published it
    isOfficial: boolean;
    downloadsCount: number;
    createdAt: string;
    updatedAt: string;
}