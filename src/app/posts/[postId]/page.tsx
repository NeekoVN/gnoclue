"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { IPost } from "../../types/post";
import { IComment } from "../../types/comment";
import { getPost } from "../../services/post";
import {
  getCommentsByPost,
  createComment,
} from "../../services/comment";
import PostDetails from "../../components/common/postDetails";
import Comment from "../../components/common/comment";

export default function PostDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const postId = params.postId as string;

  const [post, setPost] = useState<IPost | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch post and comments
  const fetchPostData = useCallback(async () => {
    if (!postId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching post data for postId:', postId);

      // Fetch post
      const postData = await getPost(postId);
      console.log('Post data received:', postData);
      setPost(postData);

      // Fetch comments
      const commentsData = await getCommentsByPost(postId, 1, 50);
      console.log('Comments data received:', commentsData);
      setComments(commentsData.comments);
    } catch (err) {
      console.error("Failed to fetch post data:", err);
      console.error("Error details:", err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : "Failed to load post");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchPostData();
    }
  }, [authLoading, isAuthenticated, fetchPostData]);

  // Handle comment submission
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      const newComment = await createComment(postId, commentContent.trim());
      setComments((prev) => [newComment, ...prev]);
      setCommentContent("");

      // Update comment count
      if (post) {
        setPost({
          ...post,
          commentCount: (post.commentCount || 0) + 1,
        });
      }
    } catch (err) {
      console.error("Failed to create comment:", err);
      alert("Failed to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reply submission
  const handleSubmitReply = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;

    try {
      setSubmitting(true);
      const newReply = await createComment(postId, replyContent.trim(), parentId);

      // Add reply to comments list
      setComments((prev) => [...prev, newReply]);
      setReplyContent("");
      setReplyingTo(null);

      // Update comment count
      if (post) {
        setPost({
          ...post,
          commentCount: (post.commentCount || 0) + 1,
        });
      }
    } catch (err) {
      console.error("Failed to create reply:", err);
      alert("Failed to post reply. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle comment update
  const handleCommentUpdate = (updatedComment: IComment) => {
    setComments((prev) =>
      prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
    );
  };

  // Handle comment delete
  const handleCommentDelete = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));

    // Update comment count
    if (post) {
      setPost({
        ...post,
        commentCount: Math.max(0, (post.commentCount || 0) - 1),
      });
    }
  };

  // Handle post update
  const handlePostUpdate = (updatedPost: IPost) => {
    setPost(updatedPost);
  };

  // Handle post delete
  const handlePostDelete = () => {
    router.push("/");
  };

  // Handle reply click
  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId);
  };

  // Organize comments into top-level and replies
  const topLevelComments = comments.filter((c) => !c.parentId);
  const getRepliesForComment = (commentId: string) => {
    return comments.filter((c) => c.parentId === commentId);
  };

  // Check if user came from feed (has history)
  const canGoBack = typeof window !== "undefined" && window.history.length > 1;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
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
          <div className="flex items-center justify-center w-full h-full">
            <div>Loading post...</div>
          </div>
        </div>
      </aside>
    );
  }

  if (error || !post) {
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
          <div className="flex flex-col items-center justify-center w-full h-full gap-4">
            <p className="text-red-500">{error || "Post not found"}</p>
            <button className="button" onClick={() => router.push("/")}>
              Go to Feed
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex !h-full">
      <div
        className="flex flex-col h-full border overflow-hidden"
        style={{
          background: "var(--surface-container-lowest)",
          boxSizing: "border-box",
          borderRadius: "0.75rem",
          width: "100%",
          maxWidth: "none",
          minWidth: "0",
        }}
      >
        {/* Header with back button */}
        <div className="flex items-center gap-2 p-4 border-b">
          <button
            className="button circle"
            onClick={() => router.back()}
            disabled={!canGoBack}
            title={canGoBack ? "Go back" : "No history to go back"}
          >
            <i>arrow_back</i>
          </button>
          <h1 className="text-xl font-bold">Post</h1>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Post details */}
          <PostDetails
            post={post}
            onPostUpdate={handlePostUpdate}
            onPostDelete={handlePostDelete}
            currentUserId={user?._id}
          />

          {/* Comment input */}
          <div className="mt-6">
            <form onSubmit={handleSubmitComment}>
              <div className="field border">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  className="w-full resize-none"
                  rows={3}
                />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  className="button"
                  disabled={!commentContent.trim() || submitting}
                >
                  {submitting ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          </div>

          {/* Comments section */}
          <div className="mt-6">
            <h2 className="text-lg font-bold mb-4">
              Comments ({post.commentCount || 0})
            </h2>

            {topLevelComments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-0">
                {topLevelComments.map((comment) => {
                  const replies = getRepliesForComment(comment._id);

                  return (
                    <div key={comment._id}>
                      <Comment
                        comment={comment}
                        onCommentUpdate={handleCommentUpdate}
                        onCommentDelete={handleCommentDelete}
                        currentUserId={user?._id}
                        onReply={handleReplyClick}
                        depth={0}
                      />

                      {/* Reply form */}
                      {replyingTo === comment._id && (
                        <div className="ml-12 mt-2 mb-4">
                          <form
                            onSubmit={(e) => handleSubmitReply(e, comment._id)}
                          >
                            <div className="field border">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full resize-none"
                                rows={2}
                                autoFocus
                              />
                            </div>
                            <div className="flex gap-2 mt-2">
                              <button
                                type="submit"
                                className="button small"
                                disabled={!replyContent.trim() || submitting}
                              >
                                {submitting ? "Posting..." : "Post Reply"}
                              </button>
                              <button
                                type="button"
                                className="button small"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent("");
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      )}

                      {/* Nested replies */}
                      {replies.map((reply) => (
                        <Comment
                          key={reply._id}
                          comment={reply}
                          onCommentUpdate={handleCommentUpdate}
                          onCommentDelete={handleCommentDelete}
                          currentUserId={user?._id}
                          depth={1}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
