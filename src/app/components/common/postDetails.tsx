"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { IPost } from "../../types/post";
import {
  upvotePost,
  downvotePost,
  deletePost,
  updatePost,
  getMediaUrl,
} from "../../services/post";
import { calculatePostVoteCount } from "../../utils/voteCalculator";
import { createOptimisticVoteUpdate } from "../../utils/optimisticVote";
import { useSocket } from "../../contexts/SocketContext";
import Avatar from "./avatar";

interface PostDetailsProps {
  post: IPost;
  onPostUpdate?: (updatedPost: IPost) => void;
  onPostDelete?: (postId: string) => void;
  currentUserId?: string;
}

interface MediaWithDimensions {
  url: string;
  key: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
}

const PostDetails: React.FC<PostDetailsProps> = ({
  post,
  onPostUpdate,
  onPostDelete,
  currentUserId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [mediaWithUrls, setMediaWithUrls] = useState<MediaWithDimensions[]>([]);
  const { socket } = useSocket();

  // Fetch media URLs and load image dimensions
  useEffect(() => {
    const fetchMediaUrls = async () => {
      if (post.media && post.media.length > 0) {
        const mediaData: MediaWithDimensions[] = [];

        for (const mediaItem of post.media) {
          try {
            const url = await getMediaUrl(mediaItem.key);

            // Load image to get dimensions
            const img = document.createElement("img");
            img.src = url;

            await new Promise<void>((resolve) => {
              img.onload = () => {
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                mediaData.push({
                  url,
                  key: mediaItem.key,
                  width: img.naturalWidth,
                  height: img.naturalHeight,
                  aspectRatio,
                });
                resolve();
              };
              img.onerror = () => {
                // If image fails to load, still add it without dimensions
                mediaData.push({
                  url,
                  key: mediaItem.key,
                });
                resolve();
              };
            });
          } catch (error) {
            console.error(
              "Failed to fetch media URL for key:",
              mediaItem.key,
              error
            );
          }
        }

        setMediaWithUrls(mediaData);
      }
    };

    fetchMediaUrls();
  }, [post.media]);

  const handleUpvote = async () => {
    if (!currentUserId) return;

    // Optimistic update
    const optimisticPost = createOptimisticVoteUpdate(
      post,
      "upvote",
      currentUserId
    );
    onPostUpdate?.(optimisticPost);

    // Emit socket event for real-time updates
    if (socket?.connected) {
      socket.emit("vote_cast", {
        postId: post._id,
        voteType: "upvote",
        userId: currentUserId,
      });
    }

    try {
      const updatedPost = await upvotePost(post._id);
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error("Failed to upvote post:", error);
      // Revert optimistic update on error
      onPostUpdate?.(post);
    }
  };

  const handleDownvote = async () => {
    if (!currentUserId) return;

    // Optimistic update
    const optimisticPost = createOptimisticVoteUpdate(
      post,
      "downvote",
      currentUserId
    );
    onPostUpdate?.(optimisticPost);

    // Emit socket event for real-time updates
    if (socket?.connected) {
      socket.emit("vote_cast", {
        postId: post._id,
        voteType: "downvote",
        userId: currentUserId,
      });
    }

    try {
      const updatedPost = await downvotePost(post._id);
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error("Failed to downvote post:", error);
      // Revert optimistic update on error
      onPostUpdate?.(post);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      await deletePost(post._id);
      onPostDelete?.(post._id);
    } catch (error) {
      console.error("Failed to delete post:", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    try {
      const updatedPost = await updatePost(post._id, { content: editContent });
      onPostUpdate?.(updatedPost);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update post:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(post.content);
    setIsEditing(false);
  };

  const isAuthor =
    !post.userId
      ? false
      : typeof post.userId === "string"
      ? post.userId === currentUserId
      : post.userId._id === currentUserId;

  const voteCount = calculatePostVoteCount(post);
  const commentCount = post.commentCount || 0;

  // Check if current user has voted
  const hasUpvoted = currentUserId && post.upvotes?.includes(currentUserId);
  const hasDownvoted = currentUserId && post.downvotes?.includes(currentUserId);

  // Get username from post data
  const username =
    !post.userId
      ? "Deleted User"
      : typeof post.userId === "string"
      ? "Unknown User"
      : post.userId.username || "Unknown User";

  const authorId =
    !post.userId
      ? null
      : typeof post.userId === "string"
      ? post.userId
      : post.userId._id;

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

  return (
    <article className="border !rounded-4xl">
      <div className="flex items-start justify-between gap-2">
        {/* author profile */}
        <Link href={`/users/${authorId}`} className="flex items-center gap-2">
          <Avatar
            user={
              typeof post.userId === "object" && post.userId !== null
                ? post.userId
                : undefined
            }
            fallbackInitial={username.charAt(0)}
            size="42px"
            backgroundColor={avatarColor}
          />
          <div className="flex flex-col items-start justify-center">
            <p className="!p-0 !m-0 text-sm font-bold">{username}</p>
            <p className="!p-0 !m-0 text-xs text-gray-500">
              {formatTimestamp(post.createdAt)}
            </p>
          </div>
        </Link>
        {/* post actions menu */}
        <div>
          <nav className="min active">
            <button className="border circle">
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
              <li>
                <button className="fill">
                  <i>share</i>
                  <span>Share</span>
                </button>
              </li>
            </menu>
          </nav>
        </div>
      </div>

      {/* tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 !mt-2">
          {post.tags.map((tag, index) => (
            <button key={tag + index} className="chip" onClick={() => {}}>
              <span style={{ color: "var(--primary)", fontWeight: "bold" }}>
                {tag}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* content - shown before images in detail view */}
      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-2 border rounded resize-none"
            rows={3}
          />
          <div className="flex gap-2 mt-2">
            <button className="button" onClick={handleSaveEdit}>
              Save
            </button>
            <button className="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="!mt-2 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* images - full size in detail view */}
      {mediaWithUrls.length > 0 && (
        <div className="!mt-4 flex flex-col gap-2">
          {mediaWithUrls.map((media, index) => {
            const aspectRatio = media.aspectRatio || 16 / 9;
            // For detail view, allow images to be taller but still constrained
            const finalAspectRatio = Math.max(aspectRatio, 9 / 16);

            return (
              <div
                key={media.key}
                className="relative w-full"
                style={{ aspectRatio: finalAspectRatio.toString() }}
              >
                <Image
                  src={media.url}
                  alt={`Post content ${index + 1}`}
                  fill
                  className="object-contain rounded"
                  sizes="(max-width: 768px) 100vw, 672px"
                  priority={index === 0}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* upvote/downvote, comment count */}
      <div className="flex items-start gap-2 mt-4">
        <nav className="group connected primary-container">
          <button
            className={`left-round${hasUpvoted ? " active" : ""}`}
            onClick={handleUpvote}
          >
            <i>keyboard_arrow_up</i>
            <span className="font-bold">{voteCount}</span>
          </button>
          <button
            className={`right-round square${hasDownvoted ? " active" : ""}`}
            onClick={handleDownvote}
          >
            <i>keyboard_arrow_down</i>
          </button>
        </nav>
        <div className="fill flex items-center gap-2">
          <i style={{ color: "var(--on-primary-container)" }}>comment</i>
          <span
            className="font-bold"
            style={{ color: "var(--on-primary-container)" }}
          >
            {commentCount} {commentCount === 1 ? "Comment" : "Comments"}
          </span>
        </div>
      </div>
    </article>
  );
};

export default PostDetails;
