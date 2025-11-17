"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  Persona,
  CreatePersonaRequest,
  UpdatePersonaRequest,
} from "../types/persona";
import * as personaService from "../services/persona";

interface PersonaContextType {
  // State
  userPersonas: Persona[];
  activePersona: Persona | null;
  publicPersonas: Persona[];
  starredPersonas: Persona[];
  loading: boolean;
  error: string | null;

  // Actions
  loadUserPersonas: () => Promise<void>;
  loadPublicPersonas: (page?: number, limit?: number) => Promise<void>;
  loadStarredPersonas: () => Promise<void>;
  createPersona: (data: CreatePersonaRequest) => Promise<Persona>;
  updatePersona: (personaId: string, data: UpdatePersonaRequest) => Promise<Persona>;
  deletePersona: (personaId: string) => Promise<void>;
  activatePersona: (personaId: string) => Promise<void>;
  forkPersona: (personaId: string) => Promise<Persona>;
  starPersona: (personaId: string) => Promise<void>;
  unstarPersona: (personaId: string) => Promise<void>;
  togglePersonaIngestion: (personaId: string, canIngest: boolean) => Promise<void>;
}

const PersonaContext = createContext<PersonaContextType | undefined>(undefined);

export const PersonaProvider = ({ children }: { children: React.ReactNode }) => {
  const [userPersonas, setUserPersonas] = useState<Persona[]>([]);
  const [activePersona, setActivePersona] = useState<Persona | null>(null);
  const [publicPersonas, setPublicPersonas] = useState<Persona[]>([]);
  const [starredPersonas, setStarredPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's personas
  const loadUserPersonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const personas = await personaService.getUserPersonas();
      setUserPersonas(personas);
      
      // Find and set active persona
      const active = personas.find((p) => p.is_active);
      setActivePersona(active || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load personas";
      setError(errorMessage);
      console.error("Error loading user personas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load public personas for discovery
  const loadPublicPersonas = useCallback(async (page: number = 1, limit: number = 20) => {
    try {
      setLoading(true);
      setError(null);
      const response = await personaService.getPublicPersonas(page, limit);
      setPublicPersonas(response.personas);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load public personas";
      setError(errorMessage);
      console.error("Error loading public personas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load starred personas
  const loadStarredPersonas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const personas = await personaService.getStarredPersonas();
      setStarredPersonas(personas);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load starred personas";
      setError(errorMessage);
      console.error("Error loading starred personas:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new persona
  const createPersona = useCallback(async (data: CreatePersonaRequest): Promise<Persona> => {
    try {
      setLoading(true);
      setError(null);
      const newPersona = await personaService.createPersona(data);
      
      // Add to user personas list
      setUserPersonas((prev) => [...prev, newPersona]);
      
      return newPersona;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create persona";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update persona
  const updatePersona = useCallback(async (
    personaId: string,
    data: UpdatePersonaRequest
  ): Promise<Persona> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await personaService.updatePersona(personaId, data);
      
      // Update in all lists
      const updateFn = (p: Persona) => p._id === personaId ? updated : p;
      setUserPersonas((prev) => prev.map(updateFn));
      setPublicPersonas((prev) => prev.map(updateFn));
      setStarredPersonas((prev) => prev.map(updateFn));
      
      // Update active persona if it's the one being updated
      if (activePersona?._id === personaId) {
        setActivePersona(updated);
      }
      
      return updated;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update persona";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activePersona]);

  // Delete persona
  const deletePersona = useCallback(async (personaId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await personaService.deletePersona(personaId);
      
      // Remove from local state
      setUserPersonas((prev) => prev.filter((p) => p._id !== personaId));
      
      // Clear active persona if it was deleted
      if (activePersona?._id === personaId) {
        setActivePersona(null);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete persona";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activePersona]);

  // Activate persona
  const activatePersona = useCallback(async (personaId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await personaService.activatePersona(personaId);
      
      // Update local state: mark this as active, others as inactive
      setUserPersonas((prev) =>
        prev.map((p) => ({
          ...p,
          is_active: p._id === personaId,
        }))
      );
      
      const newActive = userPersonas.find((p) => p._id === personaId);
      setActivePersona(newActive || null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to activate persona";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [userPersonas]);

  // Fork persona
  const forkPersona = useCallback(async (personaId: string): Promise<Persona> => {
    try {
      setLoading(true);
      setError(null);
      const forkedPersona = await personaService.forkPersona(personaId);
      
      // Add the forked persona to user personas
      setUserPersonas(prev => [...prev, forkedPersona]);
      
      return forkedPersona;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fork persona";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Star persona
  const starPersona = useCallback(async (personaId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedPersona = await personaService.starPersona(personaId);
      
      // Update in all lists
      const updateFn = (p: Persona) => p._id === personaId ? updatedPersona : p;
      setPublicPersonas((prev) => prev.map(updateFn));
      setUserPersonas((prev) => prev.map(updateFn));
      
      // Add to starred personas if not already there
      setStarredPersonas((prev) => {
        const exists = prev.some((p) => p._id === personaId);
        return exists ? prev.map(updateFn) : [...prev, updatedPersona];
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to star persona";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unstar persona
  const unstarPersona = useCallback(async (personaId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updatedPersona = await personaService.unstarPersona(personaId);
      
      // Update in all lists
      const updateFn = (p: Persona) => p._id === personaId ? updatedPersona : p;
      setPublicPersonas((prev) => prev.map(updateFn));
      setUserPersonas((prev) => prev.map(updateFn));
      
      // Remove from starred personas
      setStarredPersonas((prev) => prev.filter((p) => p._id !== personaId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to unstar persona";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle ingestion
  const togglePersonaIngestion = useCallback(async (
    personaId: string,
    canIngest: boolean
  ): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const updated = await personaService.togglePersonaIngestion(personaId, canIngest);
      
      // Update in local state
      setUserPersonas((prev) =>
        prev.map((p) => (p._id === personaId ? updated : p))
      );
      
      // Update active persona if it's the one being updated
      if (activePersona?._id === personaId) {
        setActivePersona(updated);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to toggle ingestion";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [activePersona]);

  // Load user personas on mount
  useEffect(() => {
    loadUserPersonas();
  }, [loadUserPersonas]);

  const value: PersonaContextType = {
    // State
    userPersonas,
    activePersona,
    publicPersonas,
    starredPersonas,
    loading,
    error,

    // Actions
    loadUserPersonas,
    loadPublicPersonas,
    loadStarredPersonas,
    createPersona,
    updatePersona,
    deletePersona,
    activatePersona,
    forkPersona,
    starPersona,
    unstarPersona,
    togglePersonaIngestion,
  };

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
};

export const usePersona = () => {
  const context = useContext(PersonaContext);
  if (context === undefined) {
    throw new Error("usePersona must be used within a PersonaProvider");
  }
  return context;
};
