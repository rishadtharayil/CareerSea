export interface Env {
  AI_PROVIDER?: string;
  AISTUDIO_MODEL?: string;
  AISTUDIO_API_KEY?: string;
  OPENROUTER_MODEL?: string;
  OPENROUTER_API_KEY?: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SEED_SECRET?: string;
}

export interface Question {
  id: number;
  text: string;
  order: number;
  choices: string[];
}

export interface AuthUser {
  id: string;
  email: string | null;
  username: string | null;
}

export interface ChatMessage {
  id?: number;
  step_id?: number;
  sender: 'user' | 'ai';
  text: string;
  created_at?: string;
}

export interface RoadmapStep {
  id?: number;
  career_id?: number;
  order: number;
  title: string;
  description: string;
  duration: string;
  resources: string[];
  deep_dive?: string | null;
  chat_messages?: ChatMessage[];
}

export interface CareerSuggestion {
  id?: number;
  user_response_id?: number;
  title: string;
  type: string;
  description: string;
  reasoning: string;
  roadmap_steps?: RoadmapStep[];
}

export interface UserResponse {
  id?: number;
  /** Supabase Auth user UUID. Null for anonymous assessments. */
  user_id?: string | null;
  answers: Record<string, any>;
  created_at?: string;
  suggestions?: CareerSuggestion[];
}
