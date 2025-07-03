/**
 * Utility functions for calculating vote counts
 */

/**
 * Calculates the net vote count (upvotes - downvotes)
 * @param upvotes - Array of user IDs who upvoted
 * @param downvotes - Array of user IDs who downvoted
 * @returns The net vote count (can be negative)
 */
export const calculateVoteCount = (
  upvotes?: string[],
  downvotes?: string[]
): number => {
  const upvoteCount = upvotes?.length || 0;
  const downvoteCount = downvotes?.length || 0;
  return upvoteCount - downvoteCount;
};

/**
 * Calculates the net vote count for a post object
 * @param post - Post object with upvotes and downvotes arrays
 * @returns The net vote count (can be negative)
 */
export const calculatePostVoteCount = (post: {
  upvotes?: string[];
  downvotes?: string[];
}): number => {
  return calculateVoteCount(post.upvotes, post.downvotes);
};

/**
 * Formats vote count for display
 * @param voteCount - The vote count to format
 * @returns Formatted string (e.g., "5", "-3", "0")
 */
export const formatVoteCount = (voteCount: number): string => {
  return voteCount.toString();
}; 