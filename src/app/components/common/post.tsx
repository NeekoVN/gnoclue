"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { IPost } from "../../types/post";
import {
  upvotePost,
  downvotePost,
  deletePost,
  updatePost,
} from "../../services/post";
import { calculatePostVoteCount } from "../../utils/voteCalculator";
import Image from "next/image";

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
  const handleUpvote = async () => {
    try {
      const updatedPost = await upvotePost(post._id);
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error("Failed to upvote post:", error);
    }
  };

  const handleDownvote = async () => {
    try {
      const updatedPost = await downvotePost(post._id);
      onPostUpdate?.(updatedPost);
    } catch (error) {
      console.error("Failed to downvote post:", error);
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

  // Get username from post data
  const username =
    typeof post.userId === "string"
      ? "Unknown User"
      : post.userId.username || "Unknown User";

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
    <article className="border round">
      <div className="flex items-start justify-between gap-2">
        {/* author profile */}
        <div className="flex items-center gap-2">
          <Image
            src="/favicon.png"
            alt={`${username}'s avatar`}
            width={48}
            height={48}
            className="rounded-full"
          />
          <div className="flex flex-col items-start justify-center">
            <p className="!p-0 !m-0 text-sm font-bold">{username}</p>
            <p className="!p-0 !m-0 text-xs text-gray-500">
              {formatTimestamp(post.createdAt)}
            </p>
          </div>
        </div>
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
      {post.images && post.images.length > 0 && (
        <div className="mt-2">
          {post.images.map((image, index) => (
            <Image
              key={index}
              src={image}
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
        <p className="mt-2">{post.content}</p>
      )}

      {/* upvote/downvote, comment, share */}
      <div className="flex items-start gap-2 mt-4">
        <nav className="group split">
          <button className="left-round fill" onClick={handleUpvote}>
            <i>keyboard_arrow_up</i>
            <span className="font-bold">{voteCount}</span>
          </button>
          <button className="right-round square fill" onClick={handleDownvote}>
            <i>keyboard_arrow_down</i>
          </button>
        </nav>
        <button className="fill">
          <i>comment</i>
          <span>{commentCount}</span>
        </button>
        <button className="fill">
          <i>share</i>
          <span>Share</span>
        </button>
      </div>
    </article>
  );
};

export default dynamic(() => Promise.resolve(Post), { ssr: false });
