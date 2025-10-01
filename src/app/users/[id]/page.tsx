"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  getPublicUserById,
  getUserPosts,
  followUser,
  unfollowUser,
} from "../../services/user";
import { IUserPublic } from "../../types/user";
import { IPost } from "../../types/post";
import { createDirectConversation } from "../../services/messaging";
import App from "../../components/App";
import Avatar from "../../components/common/avatar";
import Post from "../../components/common/post";
import { useAuth } from "../../contexts/AuthContext";

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params?.id as string;
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<IUserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<IPost[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [followers, setFollowers] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const u = await getPublicUserById(userId);
        if (!mounted) return;
        setProfile(u);
        setFollowers(u.followers.length);

        // Check if current user is following this profile
        if (user && user.following) {
          const isUserFollowing = user.following.includes(userId);
          setIsFollowing(isUserFollowing);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [userId, user]);

  useEffect(() => {
    const loadPosts = async () => {
      const res = await getUserPosts<IPost>(userId, 1, 10);
      setPosts(res.posts);
      setPage(1);
      setHasMore(res.hasMore);
    };
    loadPosts();
  }, [userId]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await getUserPosts<IPost>(userId, next, 10);
      setPosts((prev) => [...prev, ...res.posts]);
      setPage(next);
      setHasMore(res.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }, [page, userId, hasMore, loadingMore]);

  const doFollow = useCallback(async () => {
    if (isFollowing === true) return;
    setIsFollowing(true);
    const res = await followUser(userId);
    setFollowers(res.targetFollowers);

    // Refresh user data to get updated following array
    await refreshUser();
  }, [userId, isFollowing, refreshUser]);

  const doUnfollow = useCallback(async () => {
    if (isFollowing === false) return;
    setIsFollowing(false);
    const res = await unfollowUser(userId);
    setFollowers(res.targetFollowers);

    // Refresh user data to get updated following array
    await refreshUser();
  }, [userId, isFollowing, refreshUser]);

  const handleMessage = useCallback(async () => {
    const { conversationId } = await createDirectConversation(userId);
    // Store intent for MessagePanel to pick up
    if (typeof window !== "undefined") {
      sessionStorage.setItem("openConversationId", conversationId);
      // Dispatch event for desktop panels that are already mounted
      window.dispatchEvent(
        new CustomEvent("openConversation", { detail: conversationId })
      );
    }
  }, [userId]);

  // Generate avatar color based on username
  const avatarColor = useMemo(() => {
    if (!profile?.username) return "var(--primary)";
    const colors = [
      "var(--error)",
      "var(--primary)",
      "var(--tertiary)",
      "var(--secondary)",
      "var(--surface-variant)",
      "var(--outline)",
    ];
    const index = profile.username.charCodeAt(0) % colors.length;
    return colors[index];
  }, [profile?.username]);

  if (loading) {
    return (
      <App>
        <div className="center-align">
          <div className="shape loading-indicator extra"></div>
        </div>
      </App>
    );
  }

  if (!profile) {
    return (
      <App>
        <div className="center-align">
          <div className="card">
            <div className="center-align">
              <i className="large">person_off</i>
              <h3>User not found</h3>
              <p>
                The user you&apos;re looking for doesn&apos;t exist or has been
                removed.
              </p>
            </div>
          </div>
        </div>
      </App>
    );
  }

  return (
    <App>
      <div className="!w-full !h-full flex justify-center px-4 py-4">
        <div className="w-full max-w-4xl space-y-6 !px-2">
          {/* Profile Header - Redesigned with proper spacing */}
          <div
            className="card !p-0 !overflow-hidden !rounded-tl-none !rounded-tr-none border !border-t-0"
            style={{ backgroundColor: "var(--surface)" }}>
            {/* Cover Image */}
            <div
              className="!h-48 !w-full !relative"
              style={{
                background: `linear-gradient(135deg, var(--primary-container), var(--secondary-container))`,
              }}
            />

            {/* Profile Info Section */}
            <div className="!relative !px-6 !pb-6">
              {/* Avatar Row - Horizontal layout with avatar, username (desktop), and buttons */}
              <div
                className="!flex !items-center !gap-4 !mb-6"
                style={{ marginTop: "-2rem" }}>
                {/* Avatar */}
                <div
                  className="!flex-shrink-0 !border-4"
                  style={{
                    borderColor: "var(--surface)",
                    borderRadius: "9999px",
                  }}>
                  <Avatar
                    user={profile}
                    size="7rem"
                    backgroundColor={avatarColor}
                  />
                </div>

                {/* Username - Desktop only */}
                <div className="!flex-1 !min-w-0 !hidden md:!block">
                  <h1
                    className="!font-bold !break-words !text-4xl"
                    style={{ color: "var(--on-surface)" }}>
                    {profile.username}
                  </h1>
                </div>

                {/* Action Buttons */}
                <div className="!flex !flex-shrink-0 !mt-3">
                  {user?._id === profile._id ? (
                    /* Edit Profile button for own profile */
                    <button className="button large primary">
                      <i>edit</i>
                      Edit Profile
                    </button>
                  ) : (
                    /* Follow/Message buttons for other profiles */
                    <>
                      <button className="circle large" onClick={handleMessage}>
                        <i>chat</i>
                      </button>
                      <button
                        className={`button large ${
                          isFollowing ? "" : "primary"
                        }`}
                        onClick={isFollowing ? doUnfollow : doFollow}>
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* User Info - Below the avatar row */}
              <div className="!pl-0">
                {/* Username - Mobile only */}
                <h1
                  className="!font-bold !break-words !text-4xl !mb-4 !block md:!hidden"
                  style={{ color: "var(--on-surface)" }}>
                  {profile.username}
                </h1>

                {/* Member Since */}
                <p
                  className="!text-sm !mb-4"
                  style={{ color: "var(--on-surface-variant)" }}>
                  Member since{" "}
                  {new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>

                {/* Stats with proper spacing */}
                <div className="!flex !items-center !gap-6">
                  <div className="!flex !items-center !gap-2">
                    <span
                      className="!font-bold !text-lg"
                      style={{ color: "var(--on-surface)" }}>
                      {posts.length}
                    </span>
                    <span
                      className="!text-sm"
                      style={{ color: "var(--on-surface-variant)" }}>
                      posts
                    </span>
                  </div>
                  <div className="!flex !items-center !gap-2">
                    <span
                      className="!font-bold !text-lg"
                      style={{ color: "var(--on-surface)" }}>
                      {followers ?? profile.followers.length}
                    </span>
                    <span
                      className="!text-sm"
                      style={{ color: "var(--on-surface-variant)" }}>
                      followers
                    </span>
                  </div>
                  <div className="!flex !items-center !gap-2">
                    <span
                      className="!font-bold !text-lg"
                      style={{ color: "var(--on-surface)" }}>
                      {profile.following.length}
                    </span>
                    <span
                      className="!text-sm"
                      style={{ color: "var(--on-surface-variant)" }}>
                      following
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2
                className="!text-3xl !px-4 !py-4 !font-bold "
                style={{ color: "var(--on-surface)" }}>
                Posts
              </h2>
            </div>

            {posts.length === 0 ? (
              <div
                className="card center-align"
                style={{ backgroundColor: "var(--surface)" }}>
                <i className="large" style={{ color: "var(--outline)" }}>
                  article
                </i>
                <h3 style={{ color: "var(--on-surface)" }}>No posts yet</h3>
                <p style={{ color: "var(--on-surface-variant)" }}>
                  @{profile.username} hasn&apos;t shared anything yet.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Post
                    key={post._id}
                    post={post}
                    onPostUpdate={() => {}}
                    onPostDelete={() => {}}
                    currentUserId={user?._id}
                  />
                ))}

                {hasMore && (
                  <div className="center-align">
                    <button
                      className={`button ${
                        loadingMore ? "disabled" : "primary"
                      }`}
                      onClick={loadMore}
                      disabled={loadingMore}>
                      {loadingMore ? (
                        <div className="flex items-center gap-2">
                          <div className="shape loading-indicator small"></div>
                          Loading...
                        </div>
                      ) : (
                        "Load more posts"
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </App>
  );
}
