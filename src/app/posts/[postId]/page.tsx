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
    <aside className="flex !h-full" style={{ background: "var(--background)" }}>
      <div
        className="flex flex-col h-full border overflow-hidden"
        style={{
          boxSizing: "border-box",
          borderRadius: "0.75rem",
          width: "100%",
          maxWidth: "none",
          minWidth: "0",
        }}
      >
        {/* Header with back button and menu */}
        <div className="flex items-center justify-between gap-2 !p-2 !m-2" style={{ background: "var(--surface-variant)" }}>
          <button
            className="button circle !m-0"
            onClick={() => router.back()}
            disabled={!canGoBack}
            title={canGoBack ? "Go back" : "No history to go back"}
          >
            <i>arrow_back</i>
          </button>
          
          {/* Post actions menu */}
          <nav className="min active !m-0">
            <button className="border circle">
              <i>more_horiz</i>
            </button>
            <menu className="bottom transparent no-wrap left right-align">
              {post.userId && (typeof post.userId === "string" ? post.userId : post.userId._id) === user?._id && (
                <>
                  <li>
                    <button className="fill" onClick={() => {
                      const editContent = prompt("Edit post:", post.content);
                      if (editContent !== null && editContent.trim()) {
                        handlePostUpdate({ ...post, content: editContent });
                      }
                    }}>
                      <i>edit</i>
                      <span>Edit</span>
                    </button>
                  </li>
                  <li>
                    <button className="fill" onClick={handlePostDelete}>
                      <i>delete</i>
                      <span>Delete</span>
                    </button>
                  </li>
                </>
              )}
              <li>
                <button className="fill">
                  <i>report</i>
                  <span>Report</span>
                </button>
              </li>
              <li>
                <button className="fill">
                  <i>share</i>
                  <span>Share</span>
                </button>
              </li>
            </menu>
          </nav>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Post details - no border, no background, no rounded corners */}
          <div>
            <PostDetails
              post={post}
              onPostUpdate={handlePostUpdate}
              onPostDelete={handlePostDelete}
              currentUserId={user?._id}
              hideMenu={true}
            />
          </div>

          {/* Comment input */}
          <div className="mt-6">
            <form onSubmit={handleSubmitComment} className="flex items-center gap-2 !mx-3">
              <div className="field textarea round fill min flex-1 !m-0">
                <textarea
                  value={commentContent}
                  style={{
                    boxShadow: "none",
                    backgroundColor: "var(--surface-variant)",
                  }}
                  onChange={(e) => setCommentContent(e.target.value)}
                  placeholder="Write a comment..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmitComment(e);
                    }
                  }}
                />
              </div>
              <button
                type="submit"
                className="tertiary flex-shrink-0 !mx-0"
                disabled={!commentContent.trim() || submitting}
                style={{
                  opacity: submitting || !commentContent.trim() ? 0.6 : 1,
                  cursor: submitting || !commentContent.trim() ? "not-allowed" : "pointer",
                  height: "48px",
                }}
              >
                <i className="fill">{submitting ? "schedule" : "send"}</i>
              </button>
            </form>
          </div>

          {/* Comments section */}
          <div className="!mt-4">
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
                            className="flex items-center gap-2 !mx-3"
                          >
                            <div className="field textarea round fill min flex-1 !m-0">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                autoFocus
                                style={{
                                  boxShadow: "none",
                                  backgroundColor: "var(--surface-variant)",
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitReply(e, comment._id);
                                  } else if (e.key === "Escape") {
                                    setReplyingTo(null);
                                    setReplyContent("");
                                  }
                                }}
                              />
                            </div>
                            <button
                              type="submit"
                              className="tertiary flex-shrink-0 !mx-0"
                              disabled={!replyContent.trim() || submitting}
                              style={{
                                opacity: submitting || !replyContent.trim() ? 0.6 : 1,
                                cursor: submitting || !replyContent.trim() ? "not-allowed" : "pointer",
                                height: "48px",
                              }}
                            >
                              <i className="fill">{submitting ? "schedule" : "send"}</i>
                            </button>
                            <button
                              type="button"
                              className="flex-shrink-0 !mx-0"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent("");
                              }}
                              style={{
                                height: "48px",
                                backgroundColor: "var(--error-container)",
                                color: "var(--on-error-container)",
                              }}
                            >
                              <i className="fill">close</i>
                            </button>
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
