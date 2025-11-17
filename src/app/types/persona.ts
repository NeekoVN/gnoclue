// Persona types matching backend API

export enum PersonaVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public'
}

export interface Persona {
  _id: string;
  persona_id: string; // Rec-engine uses persona_id
  owner_user_id: string;
  display_name: string;
  description?: string;
  is_active: boolean;
  visibility: PersonaVisibility;
  parent_persona_id?: string;
  can_ingest: boolean;
  stars: number;
  starred_by: string[];
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonaRequest {
  display_name: string;
  description?: string;
  visibility?: PersonaVisibility;
  config?: Record<string, unknown>;
  can_ingest?: boolean;
}

export interface UpdatePersonaRequest {
  display_name?: string;
  description?: string;
  visibility?: PersonaVisibility;
  can_ingest?: boolean;
}

export interface PersonaResponse {
  persona_id: string;
  status: string;
  embedding_initialized: boolean;
}

export interface PersonasListResponse {
  personas: Persona[];
}

export interface PublicPersonasResponse {
  personas: Persona[];
  page: number;
  limit: number;
  total: number;
}

export interface StarredPersonasResponse {
  personas: Persona[];
}
