"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { usePersona } from "../contexts/PersonaContext";
import PersonaCard from "../components/common/personaCard";
import PersonaFormModal, { PersonaFormData } from "../components/common/personaFormModal";
import { PersonaVisibility, Persona } from "../types/persona";

// Declare beercss ui function
declare global {
  interface Window {
    ui: (selector: string) => void;
  }
}

const ui = (selector: string) => {
  if (typeof window !== "undefined" && window.ui) {
    window.ui(selector);
  }
};

export default function FeedsPage() {
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const {
    userPersonas,
    publicPersonas,
    starredPersonas,
    loading: personaLoading,
    loadUserPersonas,
    loadPublicPersonas,
    loadStarredPersonas,
    activatePersona,
    forkPersona,
    starPersona,
    unstarPersona,
    deletePersona,
    updatePersona,
    togglePersonaIngestion,
    createPersona,
  } = usePersona();

  const [activeTab, setActiveTab] = useState<"public" | "my">("public");
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | undefined>(undefined);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogType, setDialogType] = useState<"success" | "error">("success");
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null);

  // Load starred persona IDs for quick lookup
  useEffect(() => {
    if (starredPersonas.length > 0) {
      setStarredIds(new Set(starredPersonas.map((p) => p._id)));
    }
  }, [starredPersonas]);

  // Load data on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadPublicPersonas();
      loadStarredPersonas();
      loadUserPersonas();
    }
  }, [isAuthenticated, loadPublicPersonas, loadStarredPersonas, loadUserPersonas]);

  if (authLoading && !isAuthenticated) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  const handleActivate = async (personaId: string) => {
    try {
      await activatePersona(personaId);
      await loadUserPersonas();
      setDialogType("success");
      setDialogMessage("Feed activated successfully!");
      ui("#feedsDialog");
    } catch (error) {
      console.error("Failed to activate persona:", error);
      setDialogType("error");
      setDialogMessage("Failed to activate persona");
      ui("#feedsDialog");
    }
  };

  const handleFork = async (personaId: string) => {
    try {
      await forkPersona(personaId);
      setDialogType("success");
      setDialogMessage("Feed forked successfully! Check 'My Feeds' tab.");
      ui("#feedsDialog");
      // Switch to My Feeds tab to show the forked persona
      setActiveTab("my");
    } catch (error) {
      console.error("Failed to fork persona:", error);
      setDialogType("error");
      setDialogMessage("Failed to fork feed");
      ui("#feedsDialog");
    }
  };

  const handleStar = async (personaId: string) => {
    try {
      if (starredIds.has(personaId)) {
        await unstarPersona(personaId);
        setStarredIds((prev) => {
          const next = new Set(prev);
          next.delete(personaId);
          return next;
        });
      } else {
        await starPersona(personaId);
        setStarredIds((prev) => new Set(prev).add(personaId));
      }
    } catch (error) {
      console.error("Failed to update star:", error);
      setDialogType("error");
      setDialogMessage("Failed to update star");
      ui("#feedsDialog");
    }
  };

  const handleDelete = (personaId: string) => {
    setPersonaToDelete(personaId);
    ui("#deleteConfirmDialog");
  };

  const confirmDelete = async () => {
    if (!personaToDelete) return;
    
    try {
      await deletePersona(personaToDelete);
      await loadUserPersonas();
      setDialogType("success");
      setDialogMessage("Feed deleted successfully!");
      ui("#feedsDialog");
    } catch (error) {
      console.error("Failed to delete persona:", error);
      setDialogType("error");
      // Show specific error message from API
      const errorMessage = (error as {response?: {data?: {detail?: string; message?: string}}})?.response?.data?.detail 
        || (error as {response?: {data?: {detail?: string; message?: string}}})?.response?.data?.message 
        || "Failed to delete feed";
      setDialogMessage(errorMessage);
      ui("#feedsDialog");
    } finally {
      setPersonaToDelete(null);
    }
  };

  const handleEdit = async (personaId: string) => {
    const persona = userPersonas.find((p) => p._id === personaId);
    if (persona) {
      setEditingPersona(persona);
      setIsModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    setEditingPersona(undefined);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (data: PersonaFormData) => {
    if (editingPersona) {
      // Update existing persona
      await updatePersona(editingPersona._id, data);
    } else {
      // Create new persona
      await createPersona(data);
    }
  };

  const handleToggleVisibility = async (personaId: string) => {
    try {
      const persona = userPersonas.find((p) => p._id === personaId);
      if (!persona) return;

      const newVisibility = persona.visibility === PersonaVisibility.PUBLIC 
        ? PersonaVisibility.PRIVATE 
        : PersonaVisibility.PUBLIC;
      await updatePersona(personaId, { visibility: newVisibility });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
      setDialogType("error");
      setDialogMessage("Failed to toggle visibility");
      ui("#feedsDialog");
    }
  };

  const handleToggleIngest = async (personaId: string) => {
    try {
      const persona = userPersonas.find((p) => p._id === personaId);
      if (!persona) return;

      await togglePersonaIngestion(personaId, !persona.can_ingest);
    } catch (error) {
      console.error("Failed to toggle learning:", error);
      setDialogType("error");
      setDialogMessage("Failed to toggle learning");
      ui("#feedsDialog");
    }
  };

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
        <div className="!w-full !h-full !flex !flex-col !p-4">
          {/* Tabbed Navigation */}
          <nav className="tabbed">
            <a
              className={activeTab === "public" ? "active" : ""}
              onClick={() => setActiveTab("public")}
            >
              <i>public</i>
              <span>Public Feeds</span>
            </a>
            <a
              className={activeTab === "my" ? "active" : ""}
              onClick={() => setActiveTab("my")}
            >
              <i>folder</i>
              <span>My Feeds</span>
            </a>
          </nav>

          {/* Content Container */}
          <div className="!flex-1 !flex !justify-center !overflow-y-auto">
            <div className="!w-full !max-w-2xl !flex !flex-col !px-2">
              {/* Header with title and buttons */}
              <div className="!flex !items-center !justify-between !my-4">
                {activeTab === "public" ? (
                  <>
                    <h5 className="!m-0">Public Feeds</h5>
                    <button
                      className="circle"
                      onClick={() => loadPublicPersonas()}
                      disabled={personaLoading}
                    >
                      <i>refresh</i>
                    </button>
                  </>
                ) : (
                  <>
                    <h5 className="!m-0">My Feeds</h5>
                    <div className="!flex">
                      <button
                        className="circle"
                        onClick={() => loadUserPersonas()}
                        disabled={personaLoading}
                      >
                        <i>refresh</i>
                      </button>
                      <button 
                        className="circle fill" 
                        title="Create new feed"
                        onClick={handleCreateNew}
                      >
                        <i>add</i>
                      </button>
                    </div>
                  </>
                )}
              </div>

          {/* Public Feeds Tab */}
          {activeTab === "public" && (
            <div className="!flex-1">

              {personaLoading ? (
                <div className="!text-center !py-8">
                  <progress className="circle"></progress>
                </div>
              ) : publicPersonas.length === 0 ? (
                <div className="!text-center !py-8 opacity-60">
                  <i style={{ fontSize: "3rem" }}>public_off</i>
                  <p>No public feeds available</p>
                </div>
              ) : (
                <div className="!flex !flex-col !gap-4">
                  {publicPersonas.map((persona) => (
                    <PersonaCard
                      key={persona._id}
                      persona={persona}
                      currentUserId={user?._id}
                      currentUser={user || undefined}
                      isStarred={starredIds.has(persona._id)}
                      onStar={() => handleStar(persona._id)}
                      onFork={() => handleFork(persona._id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* My Feeds Tab */}
          {activeTab === "my" && (
            <div className="!flex-1">

              {personaLoading ? (
                <div className="!text-center !py-8">
                  <progress className="circle"></progress>
                </div>
              ) : userPersonas.length === 0 ? (
                <div className="!text-center !py-8 opacity-60">
                  <i style={{ fontSize: "3rem" }}>folder_off</i>
                  <p>You don&apos;t have any feeds yet</p>
                  <button className="fill">
                    <i>add</i>
                    <span>Create your first feed</span>
                  </button>
                </div>
              ) : (
                <div className="!flex !flex-col !gap-4">
                  {userPersonas.map((persona) => (
                    <PersonaCard
                      key={persona._id}
                      persona={persona}
                      currentUserId={user?._id}
                      currentUser={user || undefined}
                        isStarred={starredIds.has(persona._id)}
                        onStar={() => handleStar(persona._id)}
                        onActivate={() => handleActivate(persona._id)}
                        onDelete={() => handleDelete(persona._id)}
                        onEdit={() => handleEdit(persona._id)}
                        onToggleVisibility={() => handleToggleVisibility(persona._id)}
                        onToggleIngest={() => handleToggleIngest(persona._id)}
                      />
                  ))}
                </div>
              )}
            </div>
          )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal for creating/editing personas */}
      <PersonaFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPersona(undefined);
        }}
        onSubmit={handleModalSubmit}
        persona={editingPersona}
        title={editingPersona ? "Edit Feed" : "Create New Feed"}
      />

      {/* Notification Dialog */}
      <div className="overlay blur"></div>
      <dialog id="feedsDialog">
        <h5>{dialogType === "success" ? "Success" : "Error"}</h5>
        <div>{dialogMessage}</div>
        <nav className="right-align no-space">
          <button className="transparent link" data-ui="#feedsDialog">
            Close
          </button>
        </nav>
      </dialog>

      {/* Delete Confirmation Dialog */}
      <dialog id="deleteConfirmDialog">
        <h5>Confirm Delete</h5>
        <div>Are you sure you want to delete this feed? This action cannot be undone.</div>
        <nav className="right-align no-space">
          <button className="transparent link" data-ui="#deleteConfirmDialog">
            Cancel
          </button>
          <button 
            className="transparent link" 
            data-ui="#deleteConfirmDialog"
            onClick={confirmDelete}
          >
            Delete
          </button>
        </nav>
      </dialog>
    </aside>
  );
}
