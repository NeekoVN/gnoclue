"use client";

import React, { useState } from "react";
import { IComment } from "../../types/comment";
import {
  upvoteComment,
  downvoteComment,
  deleteComment,
  updateComment,
} from "../../services/comment";
import Avatar from "./avatar";
import Link from "next/link";

interface CommentProps {
  comment: IComment;
  onCommentUpdate?: (updatedComment: IComment) => void;
  onCommentDelete?: (commentId: string) => void;
  currentUserId?: string;
  onReply?: (commentId: string) => void;
  depth?: number; // For nested comment indentation
}

const Comment: React.FC<CommentProps> = ({
  comment,
  onCommentUpdate,
  onCommentDelete,
  currentUserId,
  onReply,
  depth = 0,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleUpvote = async () => {
    if (!currentUserId) return;

    try {
      const updatedComment = await upvoteComment(comment._id);
      onCommentUpdate?.(updatedComment);
    } catch (error) {
      console.error("Failed to upvote comment:", error);
    }
  };

  const handleDownvote = async () => {
    if (!currentUserId) return;

    try {
      const updatedComment = await downvoteComment(comment._id);
      onCommentUpdate?.(updatedComment);
    } catch (error) {
      console.error("Failed to downvote comment:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      await deleteComment(comment._id);
      onCommentDelete?.(comment._id);
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedComment = await updateComment(comment._id, editContent);
      onCommentUpdate?.(updatedComment);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update comment:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const isAuthor =
    !comment.userId
      ? false
      : typeof comment.userId === "string"
      ? comment.userId === currentUserId
      : comment.userId._id === currentUserId;

  // Calculate vote count
  const voteCount =
    (comment.upvotes?.length || 0) - (comment.downvotes?.length || 0);

  // Check if current user has voted
  const hasUpvoted = currentUserId && comment.upvotes?.includes(currentUserId);
  const hasDownvoted =
    currentUserId && comment.downvotes?.includes(currentUserId);

  // Get username from comment data
  const username =
    !comment.userId
      ? "Deleted User"
      : typeof comment.userId === "string"
      ? "Unknown User"
      : comment.userId.username || "Unknown User";

  const authorId =
    !comment.userId
      ? null
      : typeof comment.userId === "string"
      ? comment.userId
      : comment.userId._id;

  // Generate avatar color based on username
  const avatarColor = (() => {
    const colors = [
      "var(--error)",
      "var(--primary)",
      "var(--tertiary)",
      "var(--secondary)",
      "var(--surface-variant)",
      "var(--outline)",
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  })();

  // Format timestamp
  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Show deleted state
  if (comment.isDeleted) {
    return (
      <div
        className="!py-3"
        style={{
          marginLeft: depth > 0 ? `${depth * 2}rem` : "0",
        }}
      >
        <p className="text-sm text-gray-500 italic">
          This comment has been deleted
        </p>
      </div>
    );
  }

  return (
    <div
      className="!py-3 border-b"
      style={{
        marginLeft: depth > 0 ? `${depth * 2}rem` : "0",
      }}
    >
      <div className="flex items-start gap-2">
        {/* Author avatar */}
        <Link href={`/users/${authorId}`}>
          <Avatar
            user={
              typeof comment.userId === "object" && comment.userId !== null
                ? comment.userId
                : undefined
            }
            fallbackInitial={username.charAt(0)}
            size="32px"
            backgroundColor={avatarColor}
          />
        </Link>

        <div className="flex-1">
          {/* Author info and timestamp */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <Link href={`/users/${authorId}`}>
                <span className="text-sm font-bold">{username}</span>
              </Link>
              <span className="text-xs text-gray-500">
                {formatTimestamp(comment.createdAt)}
              </span>
            </div>

            {/* Comment actions menu */}
            <nav className="min active">
              <button className="border circle small">
                <i>more_horiz</i>
              </button>
              <menu className="bottom transparent no-wrap left right-align">
                {isAuthor && (
                  <>
                    <li>
                      <button className="fill" onClick={handleEdit}>
                        <i>edit</i>
                        <span>Edit</span>
                      </button>
                    </li>
                    <li>
                      <button className="fill" onClick={handleDelete}>
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
              </menu>
            </nav>
          </div>

          {/* Comment content */}
          {isEditing ? (
            <div className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded resize-none"
                rows={2}
              />
              <div className="flex gap-2 mt-2">
                <button className="button small" onClick={handleSaveEdit}>
                  Save
                </button>
                <button className="button small" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
          )}

          {/* Voting and reply buttons */}
          <div className="flex items-center gap-2 mt-2">
            <nav className="group connected primary-container">
              <button
                className={`left-round small${hasUpvoted ? " active" : ""}`}
                onClick={handleUpvote}
              >
                <i>keyboard_arrow_up</i>
                <span className="text-xs font-bold">{voteCount}</span>
              </button>
              <button
                className={`right-round square small${
                  hasDownvoted ? " active" : ""
                }`}
                onClick={handleDownvote}
              >
                <i>keyboard_arrow_down</i>
              </button>
            </nav>

            {onReply && (
              <button
                className="small fill"
                onClick={() => onReply(comment._id)}
              >
                <i style={{ color: "var(--on-primary-container)" }}>reply</i>
                <span style={{ color: "var(--on-primary-container)" }}>
                  Reply
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Comment;
