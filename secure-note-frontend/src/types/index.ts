export interface User {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  created_at: number;
  updated_at: number;
}

export interface NoteSensitivity {
  sensitivity_score: number;
  explanation: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string;
  is_encrypted: boolean;
  created_at: number;
  updated_at: number;
  decryptionPassword?: string;
  sensitivity?: NoteSensitivity;
}

export interface NotePageProps {
  params: { id: string } | Promise<{ id: string }>;
  searchParams?: Record<string, string | string[] | undefined> | Promise<Record<string, string | string[] | undefined>>;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
  recaptcha_token?: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  full_name?: string;
  recaptcha_token?: string;
}

export interface NoteRequest {
  title: string;
  content: string;
  is_encrypted: boolean;
  encryption_password?: string | null;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  is_encrypted: boolean;
  encryption_password?: string | null;
  old_encryption_password?: string | null;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  password?: string;
} 