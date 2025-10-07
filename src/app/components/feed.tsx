"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import Post from "./common/post";
import { IPost } from "../types/post";
import { getPosts } from "../services/post";
import { useAuth } from "../contexts/AuthContext";
import { useVoteUpdates } from "../hooks/useVoteUpdates";

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { token, user } = useAuth();
  const feedRef = React.useRef<HTMLDivElement>(null);

  // Handle real-time vote updates
  const handleVoteUpdate = useCallback(
    (postId: string, updatedPost: IPost) => {
      console.log("Feed: Handling vote update for post:", postId);
      console.log("Feed: Updated post data:", updatedPost);

      setPosts((prevPosts) => {
        const postIndex = prevPosts.findIndex((post) => post._id === postId);
        console.log("Feed: Found post at index:", postIndex);

        if (postIndex === -1) {
          console.warn("Feed: Post not found in current posts array:", postId);
          return prevPosts;
        }

        const existingPost = prevPosts[postIndex];

        // If the updatedPost has minimal data (just vote counts), merge with existing post
        if (updatedPost.content === "" && updatedPost.userId === "unknown") {
          const mergedPost: IPost = {
            ...existingPost,
            upvotes: updatedPost.upvotes,
            downvotes: updatedPost.downvotes,
            updatedAt: updatedPost.updatedAt,
          };

          // Update the post in place to avoid React key conflicts
          const newPosts = [...prevPosts];
          newPosts[postIndex] = mergedPost;

          console.log("Feed: Merged vote counts with existing post");
          return newPosts;
        } else {
          // Full post update - update in place
          const newPosts = [...prevPosts];
          newPosts[postIndex] = updatedPost;

          console.log("Feed: Full post update");
          return newPosts;
        }
      });
    },
    [] // Removed posts.length dependency to prevent infinite loops
  );

  // Handle vote errors
  const handleVoteError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }, []);

  // Handle optimistic new post
  const handleNewPostOptimistic = useCallback((event: CustomEvent) => {
    const newPost: IPost = event.detail;
    console.log("Adding optimistic post:", newPost);
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  }, []);

  // Handle successful post creation (replace optimistic with real)
  const handleNewPostCreated = useCallback((event: CustomEvent) => {
    const {
      optimisticId,
      realPost,
    }: { optimisticId: string; realPost: IPost } = event.detail;
    console.log(
      "Replacing optimistic post with real post:",
      optimisticId,
      "->",
      realPost._id
    );
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post._id === optimisticId ? realPost : post))
    );
  }, []);

  // Handle post creation error (remove optimistic)
  const handleNewPostError = useCallback((event: CustomEvent) => {
    const optimisticId: string = event.detail;
    console.log("Removing failed optimistic post:", optimisticId);
    setPosts((prevPosts) =>
      prevPosts.filter((post) => post._id !== optimisticId)
    );
  }, []);

  // Set up event listeners for new posts
  useEffect(() => {
    window.addEventListener(
      "newPostOptimistic",
      handleNewPostOptimistic as EventListener
    );
    window.addEventListener(
      "newPostCreated",
      handleNewPostCreated as EventListener
    );
    window.addEventListener(
      "newPostError",
      handleNewPostError as EventListener
    );

    return () => {
      window.removeEventListener(
        "newPostOptimistic",
        handleNewPostOptimistic as EventListener
      );
      window.removeEventListener(
        "newPostCreated",
        handleNewPostCreated as EventListener
      );
      window.removeEventListener(
        "newPostError",
        handleNewPostError as EventListener
      );
    };
  }, [handleNewPostOptimistic, handleNewPostCreated, handleNewPostError]);

  // Set up real-time vote updates
  useVoteUpdates({
    onVoteUpdate: handleVoteUpdate,
    onVoteError: handleVoteError,
  });

  const fetchPosts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await getPosts(pageNum, 10);

        if (append) {
          setPosts((prev) => {
            // Create a map of existing posts by ID for quick lookup
            const existingPostsMap = new Map(
              prev.map((post) => [post._id, post])
            );

            // Add new posts, avoiding duplicates
            response.posts.forEach((newPost) => {
              if (!existingPostsMap.has(newPost._id)) {
                existingPostsMap.set(newPost._id, newPost);
              }
            });

            // Convert back to array
            return Array.from(existingPostsMap.values());
          });
        } else {
          setPosts(response.posts);
        }

        // Check if we have more posts to load
        setHasMore(response.posts.length === 10);
        setPage(pageNum);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load posts");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  // Manual refresh function for testing
  const manualRefresh = useCallback(() => {
    console.log("Manual refresh triggered");
    fetchPosts(1, false);
  }, [fetchPosts]);

  useEffect(() => {
    fetchPosts();
  }, [token, fetchPosts]);

  useEffect(() => {
    const handleScroll = () => {
      if (loadingMore || !hasMore) return;

      // Find the scrolling container - it's the parent element with overflow-y-auto
      const scrollContainer = feedRef.current?.parentElement;
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;

      if (isNearBottom) {
        console.log("Near bottom, fetching page:", page + 1);
        fetchPosts(page + 1, true);
      }
    };

    // Attach scroll event to the parent element (the actual scrolling container)
    const scrollContainer = feedRef.current?.parentElement;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
      return () => scrollContainer.removeEventListener("scroll", handleScroll);
    }
  }, [page, loadingMore, hasMore, fetchPosts]);

  const handlePostUpdate = (updatedPost: IPost) => {
    setPosts((prev) => {
      const postIndex = prev.findIndex((post) => post._id === updatedPost._id);
      if (postIndex === -1) {
        console.warn("Post not found for update:", updatedPost._id);
        return prev;
      }

      // Update the post in place to avoid React key conflicts
      const newPosts = [...prev];
      newPosts[postIndex] = updatedPost;
      return newPosts;
    });
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((post) => post._id !== postId));
  };

  if (error) {
    return (
      <div className="center-align">
        <p className="text-red-600">{error}</p>
        <button className="button" onClick={() => fetchPosts(1, false)}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      ref={feedRef}
      className="!w-full !h-full flex justify-center px-4 py-4"
      style={{ boxSizing: "border-box" }}
      suppressHydrationWarning={true}
    >
      <div
        className="w-full max-w-2xl space-y-4 !pt-4 !px-2"
        style={{
          width: "100%",
          maxWidth: "42rem",
          boxSizing: "border-box",
        }}
      >
        {error && (
          <div
            className="center-align p-4 border round"
            style={{
              backgroundColor: "var(--error-container)",
              color: "var(--error)",
            }}
          >
            <p className="!m-0">{error}</p>
          </div>
        )}

        {/* Debug button for testing */}
        {process.env.NODE_ENV === "development" && (
          <div className="center-align mb-4">
            <button
              onClick={manualRefresh}
              className="button small"
              style={{
                backgroundColor: "var(--primary-container)",
                color: "var(--primary)",
              }}
            >
              🔄 Refresh Posts (Debug)
            </button>
          </div>
        )}
        {posts.length === 0 && !loading ? (
          <div className="center-align">
            <p className="text-surface-2">
              No posts yet. Be the first to post!
            </p>
          </div>
        ) : (
          <>
            {posts.map((post) => (
              <Post
                key={post._id}
                post={post}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
                currentUserId={user?._id}
              />
            ))}

            {loadingMore && (
              <div className="flex items-center justify-center py-4">
                <div className="shape loading-indicator extra"></div>
              </div>
            )}
          </>
        )}

        {loading && posts.length === 0 && (
          <div className="flex items-center justify-center h-96">
            <div className="shape loading-indicator extra"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;
