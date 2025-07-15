import { IPost } from "../types/post";

interface VoteCountUpdate {
  postId: string;
  upvotes: number;
  downvotes: number;
  netVotes: number;
  timestamp: string;
}

/**
 * Updates a post with new vote count data
 * @param existingPost - The current post object
 * @param voteUpdate - The vote count update data
 * @returns Updated post object
 */
export const updatePostWithVoteCounts = (
  existingPost: IPost,
  voteUpdate: VoteCountUpdate
): IPost => {
  // Create arrays of user IDs based on vote counts
  // This is a simplified approach - in a real app, you'd want the actual user IDs
  const upvotes = Array(voteUpdate.upvotes).fill("user_id");
  const downvotes = Array(voteUpdate.downvotes).fill("user_id");

  return {
    ...existingPost,
    upvotes,
    downvotes,
    updatedAt: voteUpdate.timestamp,
  };
}; 