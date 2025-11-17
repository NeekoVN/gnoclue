"use client";

import React, { useState, useEffect } from "react";
import { Persona, PersonaVisibility } from "../../types/persona";

interface PersonaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonaFormData) => Promise<void>;
  persona?: Persona; // If provided, we're editing. Otherwise, creating.
  title: string;
}

export interface PersonaFormData {
  display_name: string;
  description: string;
  visibility: PersonaVisibility;
  can_ingest: boolean;
}

const PersonaFormModal: React.FC<PersonaFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  persona,
  title,
}) => {
  const [formData, setFormData] = useState<PersonaFormData>({
    display_name: "",
    description: "",
    visibility: PersonaVisibility.PRIVATE,
    can_ingest: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when persona changes
  useEffect(() => {
    if (persona) {
      setFormData({
        display_name: persona.display_name,
        description: persona.description || "",
        visibility: persona.visibility,
        can_ingest: persona.can_ingest,
      });
    } else {
      setFormData({
        display_name: "",
        description: "",
        visibility: PersonaVisibility.PRIVATE,
        can_ingest: true,
      });
    }
    setError(null);
  }, [persona, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.display_name.trim()) {
      setError("Feed name is required");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save feed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="overlay blur active"></div>
      <dialog className="active">
        <form onSubmit={handleSubmit}>
          <h5 className="!mt-0">{title}</h5>

          {error && (
            <div className="!p-3 !mb-4 !bg-red-100 !text-red-800 !rounded">
              {error}
            </div>
          )}

          {/* Display Name */}
          <div className="field label border">
            <input
              type="text"
              value={formData.display_name}
              onChange={(e) =>
                setFormData({ ...formData, display_name: e.target.value })
              }
              placeholder=" "
              required
            />
          <label>Feed Name</label>
        </div>

        {/* Description */}
        <div className="field textarea label border">
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder=" "
            rows={4}
          />
          <label>Description</label>
        </div>

        {/* Visibility */}
        <div className="field label border">
          <select
            value={formData.visibility}
            onChange={(e) =>
              setFormData({
                ...formData,
                visibility: e.target.value as PersonaVisibility,
              })
            }
          >
            <option value={PersonaVisibility.PRIVATE}>Private</option>
            <option value={PersonaVisibility.PUBLIC}>Public</option>
          </select>
          <label>Visibility</label>
        </div>

        {/* Can Ingest */}
        <div className="field middle-align">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={formData.can_ingest}
              onChange={(e) =>
                setFormData({ ...formData, can_ingest: e.target.checked })
              }
            />
            <span>Enable Learning</span>
          </label>
          <div className="!text-sm opacity-60">
            Allow this feed to learn from your interactions
          </div>
        </div>

        {/* Actions */}
        <nav className="right-align no-space">
          <button type="button" className="transparent link" onClick={onClose} disabled={loading}>
            <span>Cancel</span>
          </button>
          <button type="submit" className="primary" disabled={loading}>
            {loading ? (
              <progress className="circle small"></progress>
            ) : (
              <span>{persona ? "Save Changes" : "Create Feed"}</span>
            )}
          </button>
        </nav>
      </form>
      </dialog>
    </>
  );
};

export default PersonaFormModal;
