"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import Post from "./common/post";
import { IPost } from "../types/post";
import { getPosts } from "../services/post";
import { useAuth } from "../contexts/AuthContext";

const Feed: React.FC = () => {
  const [posts, setPosts] = useState<IPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { token, user } = useAuth();
  const feedRef = React.useRef<HTMLDivElement>(null);

  const fetchPosts = async (pageNum: number = 1, append: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await getPosts(pageNum, 10);

      if (append) {
        setPosts((prev) => [...prev, ...response.posts]);
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
  };

  useEffect(() => {
    fetchPosts();
  }, [token]);

  useEffect(() => {
    const handleScroll = () => {
      if (!feedRef.current || loadingMore || !hasMore) return;

      const { scrollTop, scrollHeight, clientHeight } = feedRef.current;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 200;

      if (isNearBottom) {
        console.log("Near bottom, fetching page:", page + 1);
        fetchPosts(page + 1, true);
      }
    };

    const feedElement = feedRef.current;
    if (feedElement) {
      feedElement.addEventListener("scroll", handleScroll);
      return () => feedElement.removeEventListener("scroll", handleScroll);
    }
  }, [page, loadingMore, hasMore]);

  const handlePostUpdate = (updatedPost: IPost) => {
    setPosts((prev) =>
      prev.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
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
      className="w-full h-full overflow-y-auto flex justify-center px-4 py-4"
      suppressHydrationWarning={true}>
      <div className="w-full max-w-2xl space-y-4 !pt-4">
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
