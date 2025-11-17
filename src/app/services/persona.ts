import axios from "axios";
import { API_BASE_URL } from "../config/api";
import {
  Persona,
  CreatePersonaRequest,
  UpdatePersonaRequest,
  PersonasListResponse,
  PublicPersonasResponse,
  StarredPersonasResponse,
} from "../types/persona";

const BASE_URL = `${API_BASE_URL}/personas`;

// Get auth token for requests
const getAuthToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
};

// Create axios instance with auth header
const createAuthAxios = () => {
  const token = getAuthToken();
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Add response interceptor to handle 401 errors
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        if (typeof window !== "undefined" && window.location.pathname !== "/signin") {
          window.location.href = "/signin";
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

/**
 * Get all personas for the current user
 */
export const getUserPersonas = async (): Promise<Persona[]> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<PersonasListResponse>("");
  // Normalize: rec-engine returns persona_id, but we use _id in frontend
  return response.data.personas.map(p => ({
    ...p,
    _id: p.persona_id || p._id
  }));
};

/**
 * Create a new persona
 */
export const createPersona = async (data: CreatePersonaRequest): Promise<Persona> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.post<Persona>("", data);
  const persona = response.data;
  if (!persona) {
    throw new Error("Failed to create persona: No data returned");
  }
  return {
    ...persona,
    _id: persona.persona_id || persona._id
  };
};

/**
 * Update an existing persona (owned by user or forked to user)
 */
export const updatePersona = async (
  personaId: string,
  data: UpdatePersonaRequest
): Promise<Persona> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.put<Persona>(`/${personaId}`, data);
  
  const persona = response.data;
  if (!persona) {
    throw new Error("Failed to update persona: No data returned");
  }
  return {
    ...persona,
    _id: persona.persona_id || persona._id
  };
};

/**
 * Delete a persona
 */
export const deletePersona = async (personaId: string): Promise<{ message: string }> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.delete<{ message: string }>(`/${personaId}`);
  return response.data;
};

/**
 * Activate a persona (set as active for recommendations)
 */
export const activatePersona = async (personaId: string): Promise<{ message: string }> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.post<{ message: string }>(`/${personaId}/activate`);
  return response.data;
};

/**
 * Fork a public persona (create a copy owned by current user)
 */
export const forkPersona = async (personaId: string): Promise<Persona> => {
  const axiosInstance = createAuthAxios();
  // Don't send display_name and description - let backend use source persona's values
  const response = await axiosInstance.post<Persona>(`/${personaId}/fork`, {});
  const persona = response.data;
  if (!persona) {
    throw new Error("Failed to fork persona: No data returned");
  }
  return {
    ...persona,
    _id: persona.persona_id || persona._id
  };
};

/**
 * Star a persona
 */
export const starPersona = async (personaId: string): Promise<Persona> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.post<Persona>(`/${personaId}/star`);
  const persona = response.data;
  if (!persona) {
    throw new Error("Failed to star persona: No data returned");
  }
  return {
    ...persona,
    _id: persona.persona_id || persona._id
  };
};

/**
 * Unstar a persona
 */
export const unstarPersona = async (personaId: string): Promise<Persona> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.delete<Persona>(`/${personaId}/star`);
  const persona = response.data;
  if (!persona) {
    throw new Error("Failed to unstar persona: No data returned");
  }
  return {
    ...persona,
    _id: persona.persona_id || persona._id
  };
};

/**
 * Get public personas (browse/discover)
 */
export const getPublicPersonas = async (
  page: number = 1,
  limit: number = 20
): Promise<PublicPersonasResponse> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<PublicPersonasResponse>("/public", {
    params: { page, limit },
  });
  return {
    ...response.data,
    personas: response.data.personas.map(p => ({
      ...p,
      _id: p.persona_id || p._id
    }))
  };
};

/**
 * Get personas starred by current user
 */
export const getStarredPersonas = async (): Promise<Persona[]> => {
  const axiosInstance = createAuthAxios();
  const response = await axiosInstance.get<StarredPersonasResponse>("/starred");
  return response.data.personas.map(p => ({
    ...p,
    _id: p.persona_id || p._id
  }));
};

/**
 * Toggle can_ingest flag for a persona
 * Helper function that updates just the can_ingest field
 */
export const togglePersonaIngestion = async (
  personaId: string,
  canIngest: boolean
): Promise<Persona> => {
  return updatePersona(personaId, { can_ingest: canIngest });
};
