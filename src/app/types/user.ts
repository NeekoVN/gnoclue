// src/types/user.ts

// This interface defines the shape of a User object as it would be exposed
// by your API, for example, when fetching a user's profile or when a user
// field is populated on another document like a Post.
// It explicitly omits sensitive fields like 'password'.
export interface IUser {
    _id: string; // MongoDB ObjectId is always returned as a string in JSON
    username: string;
    email: string; // If your API allows exposing email in profile or public views
    avatar?: string; // URL to user's avatar image in S3 bucket
    // Add other non-sensitive fields that your API might return for a user
    following?: string[]; // Array of User IDs (strings)
    followers?: string[]; // Array of User IDs (strings)
    createdAt: string; // Dates are returned as ISO 8601 strings
    updatedAt: string; // Dates are returned as ISO 8601 strings
}

// Public-facing user info per API docs for `/api/users/:id`
export interface IUserPublic {
    _id: string;
    username: string;
    avatar?: string; // URL to user's avatar image in S3 bucket
    followers: string[]; // Array of User IDs (ObjectIds)
    following: string[]; // Array of User IDs (ObjectIds)
    createdAt: string;
}