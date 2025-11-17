"use client";

import React, { useState, useEffect } from "react";
import { Persona, PersonaVisibility } from "../../types/persona";
import { IUser, IUserPublic } from "../../types/user";
import { getPublicUserById } from "../../services/user";
import Avatar from "./avatar";

interface PersonaCardProps {
  persona: Persona;
  currentUserId?: string;
  currentUser?: IUser | IUserPublic; // Accept either user type
  isStarred: boolean;
  onActivate?: () => void;
  onFork?: () => void;
  onStar?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onToggleVisibility?: () => void;
  onToggleIngest?: () => void;
}

const PersonaCard: React.FC<PersonaCardProps> = ({
  persona,
  currentUserId,
  currentUser,
  isStarred,
  onActivate,
  onFork,
  onStar,
  onDelete,
  onEdit,
  onToggleVisibility,
  onToggleIngest,
}) => {
  const isActive = persona.is_active;
  const isOwnedByCurrentUser = currentUserId === persona.owner_user_id;
  const canFork = persona.visibility === PersonaVisibility.PUBLIC;

  const [ownerUser, setOwnerUser] = useState<IUserPublic | null>(null);
  const [loadingOwner, setLoadingOwner] = useState(false);

  // Fetch owner user info if not current user
  useEffect(() => {
    if (!isOwnedByCurrentUser && persona.owner_user_id) {
      setLoadingOwner(true);
      getPublicUserById(persona.owner_user_id)
        .then((user) => setOwnerUser(user))
        .catch((error) => console.error("Failed to load owner user:", error))
        .finally(() => setLoadingOwner(false));
    }
  }, [persona.owner_user_id, isOwnedByCurrentUser]);

  return (
    <article className="border !rounded-4xl" style={{ minWidth: "0" }}>
      {/* Row 1: Heading and Body */}
      <div className="!flex !gap-4">
        {/* Heading - Image (hidden for now) */}
        <div className="!hidden">
          {/* TODO: Persona image placeholder */}
        </div>

        {/* Body - Display name, description, author chip */}
        <div className="!flex-1 !flex !flex-col !gap-2">
          {/* Top section: Display name and author chip */}
          <div className="!flex !items-start !justify-between !gap-2">
            <div className="!flex-1 !flex !items-center !gap-2">
              <h6 className="!m-0 !font-bold">{persona.display_name}</h6>
              {persona.parent_persona_id && (
                <i className="opacity-60" title="Forked persona">fork_right</i>
              )}
            </div>
          <button className="chip round small">
            {loadingOwner ? (
              <>
                <Avatar
                  fallbackInitial="?"
                  size="20px"
                  backgroundColor="var(--surface-variant)"
                />
                <span>Loading...</span>
              </>
            ) : isOwnedByCurrentUser ? (
              <>
                <Avatar
                  user={currentUser}
                  fallbackInitial="Y"
                  size="20px"
                  backgroundColor="var(--primary)"
                />
                <span>You</span>
              </>
            ) : ownerUser ? (
              <>
                <Avatar
                  user={ownerUser}
                  size="20px"
                />
                <span>{ownerUser.username}</span>
              </>
            ) : (
              <>
                <Avatar
                  fallbackInitial="?"
                  size="20px"
                  backgroundColor="var(--surface-variant)"
                />
                <span>Unknown</span>
              </>
            )}
          </button>
        </div>

        {/* Bottom section: Description */}
        <p className="!m-0 !text-sm opacity-80">
          {persona.description || "No description provided"}
        </p>

        {/* Status indicators */}
        <div className="!flex !flex-wrap">
          {isActive && (
            <button key="active" className="chip round small fill primary">
              <i>check_circle</i>
              <span>Active</span>
            </button>
          )}
          {persona.visibility === PersonaVisibility.PUBLIC && (
            <button key="public" className="chip round small">
              <i>public</i>
              <span>Public</span>
            </button>
          )}
          {persona.parent_persona_id && (
            <button key="forked" className="chip round small">
              <i>fork_right</i>
              <span>Forked</span>
            </button>
          )}
          {!persona.can_ingest && (
            <button key="paused" className="chip round small">
              <i>pause_circle</i>
              <span>Learning Paused</span>
            </button>
          )}
          <button key="stars" className="chip round small">
            <i>star</i>
            <span>{persona.stars}</span>
          </button>
        </div>
      </div>
      </div>

      {/* Row 2: Action buttons */}
      <div className="!flex !items-center !flex-wrap !gap-y-3 !mt-4">
        {/* Star button */}
        <button
          className={isStarred ? "border" : ""}
          onClick={onStar}
        >
          <i>{isStarred ? "star" : "star_border"}</i>
          <span>{isStarred ? "Starred" : "Star"}</span>
        </button>

        {/* Fork button (only for public personas not owned by user) */}
        {canFork && onFork && (
          <button
            onClick={onFork}
          >
            <i>fork_right</i>
            <span>Fork</span>
          </button>
        )}

        {/* Edit button (only for owned personas) */}
        {isOwnedByCurrentUser && onEdit && (
          <button
            onClick={onEdit}
          >
            <i>edit</i>
            <span>Edit</span>
          </button>
        )}

        {/* Visibility toggle (only for owned personas) */}
        {isOwnedByCurrentUser && onToggleVisibility && (
          <button
            onClick={onToggleVisibility}
          >
            <i>{persona.visibility === PersonaVisibility.PUBLIC ? "lock" : "public"}</i>
            <span>{persona.visibility === PersonaVisibility.PUBLIC ? "Make Private" : "Make Public"}</span>
          </button>
        )}

        {/* Ingest toggle (only for owned personas) */}
        {isOwnedByCurrentUser && onToggleIngest && (
          <button
            onClick={onToggleIngest}
          >
            <i>{persona.can_ingest ? "pause_circle" : "play_circle"}</i>
            <span>{persona.can_ingest ? "Pause Learning" : "Resume Learning"}</span>
          </button>
        )}

        {/* Activate button (only for owned personas) */}
        {isOwnedByCurrentUser && !isActive && onActivate && (
          <button
            className="fill"
            onClick={onActivate}
          >
            <i>play_arrow</i>
            <span>Activate</span>
          </button>
        )}

        {/* Delete button (only for owned personas) */}
        {isOwnedByCurrentUser && onDelete && (
          <button
            className="border"
            onClick={onDelete}
          >
            <i>delete</i>
            <span>Delete</span>
          </button>
        )}
      </div>
    </article>
  );
};

export default PersonaCard;
