import { IPost } from "../types/post";

/**
 * Creates an optimistic update for a vote action
 * @param post - The current post
 * @param voteType - "upvote" or "downvote"
 * @param userId - The user ID performing the vote
 * @returns Updated post with optimistic vote count
 */
export const createOptimisticVoteUpdate = (
  post: IPost,
  voteType: "upvote" | "downvote",
  userId: string
): IPost => {
  const updatedPost = { ...post };
  
  if (voteType === "upvote") {
    // Remove from downvotes if exists
    if (updatedPost.downvotes?.includes(userId)) {
      updatedPost.downvotes = updatedPost.downvotes.filter(id => id !== userId);
    }
    // Add to upvotes if not already there
    if (!updatedPost.upvotes?.includes(userId)) {
      updatedPost.upvotes = [...(updatedPost.upvotes || []), userId];
    }
  } else {
    // Remove from upvotes if exists
    if (updatedPost.upvotes?.includes(userId)) {
      updatedPost.upvotes = updatedPost.upvotes.filter(id => id !== userId);
    }
    // Add to downvotes if not already there
    if (!updatedPost.downvotes?.includes(userId)) {
      updatedPost.downvotes = [...(updatedPost.downvotes || []), userId];
    }
  }
  
  return updatedPost;
};

/**
 * Reverts an optimistic vote update
 * @param post - The current post
 * @param originalPost - The original post before optimistic update
 * @returns Original post
 */
export const revertOptimisticVoteUpdate = (
  post: IPost,
  originalPost: IPost
): IPost => {
  return originalPost;
}; 