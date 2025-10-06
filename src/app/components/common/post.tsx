"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
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
import Image from "next/image";
import Link from "next/link";
import Avatar from "./avatar";

interface PostProps {
  post: IPost;
  onPostUpdate?: (updatedPost: IPost) => void;
  onPostDelete?: (postId: string) => void;
  currentUserId?: string;
}

const Post: React.FC<PostProps> = ({
  post,
  onPostUpdate,
  onPostDelete,
  currentUserId,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [mediaUrls, setMediaUrls] = useState<{ [key: string]: string }>({});
  const { socket } = useSocket();

  // Fetch media URLs when component mounts or post changes
  useEffect(() => {
    const fetchMediaUrls = async () => {
      if (post.media && post.media.length > 0) {
        const urls: { [key: string]: string } = {};
        for (const mediaItem of post.media) {
          try {
            const url = await getMediaUrl(mediaItem.key);
            urls[mediaItem.key] = url;
          } catch (error) {
            console.error(
              "Failed to fetch media URL for key:",
              mediaItem.key,
              error
            );
          }
        }
        setMediaUrls(urls);
      }
    };

    fetchMediaUrls();
  }, [post.media]);
  const handleUpvote = async () => {
    if (!currentUserId) return;

    console.log("Upvoting post:", post._id, "User:", currentUserId);
    console.log("Socket connected:", socket?.connected);

    // Optimistic update
    const optimisticPost = createOptimisticVoteUpdate(
      post,
      "upvote",
      currentUserId
    );
    onPostUpdate?.(optimisticPost);

    // Emit socket event for real-time updates
    if (socket?.connected) {
      console.log("Emitting vote_cast event");
      socket.emit("vote_cast", {
        postId: post._id,
        voteType: "upvote",
        userId: currentUserId,
      });
    } else {
      console.warn("Socket not connected, skipping real-time update");
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

    console.log("Downvoting post:", post._id, "User:", currentUserId);
    console.log("Socket connected:", socket?.connected);

    // Optimistic update
    const optimisticPost = createOptimisticVoteUpdate(
      post,
      "downvote",
      currentUserId
    );
    onPostUpdate?.(optimisticPost);

    // Emit socket event for real-time updates
    if (socket?.connected) {
      console.log("Emitting vote_cast event");
      socket.emit("vote_cast", {
        postId: post._id,
        voteType: "downvote",
        userId: currentUserId,
      });
    } else {
      console.warn("Socket not connected, skipping real-time update");
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
    typeof post.userId === "string"
      ? post.userId === currentUserId
      : post.userId._id === currentUserId;

  const voteCount = calculatePostVoteCount(post);
  const commentCount = post.commentCount || 0;

  // Check if current user has voted
  const hasUpvoted = currentUserId && post.upvotes?.includes(currentUserId);
  const hasDownvoted = currentUserId && post.downvotes?.includes(currentUserId);

  // Debug vote count
  // console.log("Post vote count:", {
  //   postId: post._id,
  //   upvotes: post.upvotes?.length || 0,
  //   downvotes: post.downvotes?.length || 0,
  //   calculatedVoteCount: voteCount,
  //   hasUpvoted,
  //   hasDownvoted,
  //   currentUserId,
  // });

  // Get username from post data
  const username =
    typeof post.userId === "string"
      ? "Unknown User"
      : post.userId.username || "Unknown User";

  const authorId =
    typeof post.userId === "string" ? post.userId : post.userId._id;

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
            user={typeof post.userId === "object" ? post.userId : undefined}
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

      {/* images */}
      {post.media && post.media.length > 0 && (
        <div className="mt-2">
          {post.media.map((mediaItem, index) => (
            <Image
              key={index}
              src={mediaUrls[mediaItem.key] || "/default-avatar.png"} // Fallback to default avatar while loading
              alt="Post content"
              width={400}
              height={300}
              className="w-full h-auto rounded mb-2"
            />
          ))}
        </div>
      )}

      {/* content */}
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
        <p className="mt-2 whitespace-pre-wrap">{post.content}</p>
      )}

      {/* upvote/downvote, comment, share */}
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
        <button className="fill">
          <i>comment</i>
          <span>{commentCount}</span>
        </button>
        {/* <button className="fill">
          <i>share</i>
          <span>Share</span>
        </button> */}
      </div>
    </article>
  );
};

export default dynamic(() => Promise.resolve(Post), { ssr: false });
