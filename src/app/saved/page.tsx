"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import Post from "../components/common/post";
import { IPost } from "../types/post";
import { getSavedPosts } from "../services/saved";
import { useVoteUpdates } from "../hooks/useVoteUpdates";

export default function SavedPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Handle real-time vote updates
  const handleVoteUpdate = useCallback(
    (postId: string, updatedPost: IPost) => {
      setPosts((prevPosts) => {
        const postIndex = prevPosts.findIndex((post) => post._id === postId);

        if (postIndex === -1) {
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

          const newPosts = [...prevPosts];
          newPosts[postIndex] = mergedPost;
          return newPosts;
        } else {
          const newPosts = [...prevPosts];
          newPosts[postIndex] = updatedPost;
          return newPosts;
        }
      });
    },
    []
  );

  // Handle vote errors
  const handleVoteError = useCallback((errorMessage: string) => {
    setError(errorMessage);
    setTimeout(() => setError(null), 5000);
  }, []);

  // Set up real-time vote updates
  useVoteUpdates({
    onVoteUpdate: handleVoteUpdate,
    onVoteError: handleVoteError,
  });

  const fetchSavedPosts = useCallback(
    async (pageNum: number = 1, append: boolean = false) => {
      try {
        if (pageNum === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await getSavedPosts(pageNum, 10);

        if (append) {
          setPosts((prev) => {
            const existingPostsMap = new Map(
              prev.map((post) => [post._id, post])
            );

            response.posts.forEach((newPost) => {
              if (!existingPostsMap.has(newPost._id)) {
                existingPostsMap.set(newPost._id, newPost);
              }
            });

            return Array.from(existingPostsMap.values());
          });
        } else {
          setPosts(response.posts);
        }

        setHasMore(response.posts.length === 10);
        setPage(pageNum);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || "Failed to load saved posts");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedPosts(1, false);
    }
  }, [isAuthenticated, fetchSavedPosts]);

  // Handle post update
  const handlePostUpdate = useCallback((updatedPost: IPost) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  }, []);

  // Handle post delete (remove from saved list)
  const handlePostDelete = useCallback((postId: string) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post._id !== postId));
  }, []);

  // Infinite scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (
        scrollHeight - scrollTop <= clientHeight * 1.5 &&
        !loadingMore &&
        hasMore &&
        !loading
      ) {
        fetchSavedPosts(page + 1, true);
      }
    },
    [loadingMore, hasMore, loading, page, fetchSavedPosts]
  );

  if (authLoading && !isAuthenticated) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return (
    <aside className="flex !h-full">
      <div
        className="flex h-full border overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          boxSizing: "border-box",
          borderRadius: "0.75rem",
          width: "100%",
          maxWidth: "none",
          minWidth: "0",
        }}
      >
        <div className="!w-full !h-full !flex !flex-col !p-4">
          {/* Header */}
          <div className="!flex !items-center !justify-between !mb-4">
            <h5 className="!m-0">Saved Posts</h5>
            <button
              className="circle"
              onClick={() => fetchSavedPosts(1, false)}
              disabled={loading}
            >
              <i>refresh</i>
            </button>
          </div>

          {/* Content Container */}
          <div 
            className="!w-full !flex-1 !flex !justify-center !overflow-y-auto"
            onScroll={handleScroll}
          >
            <div className="!w-full !max-w-2xl !flex !flex-col">
              {/* Error Message */}
              {error && (
                <div className="!mb-4 !p-4 !bg-red-100 !text-red-700 !rounded">
                  {error}
                </div>
              )}

              {/* Loading State */}
              {loading ? (
                <div className="!text-center !py-8">
                  <progress className="circle"></progress>
                </div>
              ) : posts.length === 0 ? (
                <div className="!text-center !py-8 opacity-60">
                  <i style={{ fontSize: "3rem" }}>bookmark_border</i>
                  <p>No saved posts yet</p>
                  <p className="!text-sm">
                    Posts you save will appear here
                  </p>
                </div>
              ) : (
                <div className="!flex !flex-col !gap-4 !items-center !w-full">
                  {posts.map((post) => (
                    <div key={post._id} className="!w-full !max-w-2xl">
                      <Post
                        post={post}
                        onPostUpdate={handlePostUpdate}
                        onPostDelete={handlePostDelete}
                        currentUserId={user?._id}
                      />
                    </div>
                  ))}

                  {/* Loading More Indicator */}
                  {loadingMore && (
                    <div className="!text-center !py-4">
                      <progress className="circle"></progress>
                    </div>
                  )}

                  {/* End of List Indicator */}
                  {!hasMore && posts.length > 0 && (
                    <div className="!text-center !py-4 opacity-60">
                      <p>You&apos;ve reached the end</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
