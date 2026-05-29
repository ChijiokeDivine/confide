// src/types/index.ts

export type QuestionType = 
  | "text" 
  | "textarea" 
  | "radio" 
  | "checkbox" 
  | "scale" 
  | "email"
  | "date"
  | "time"
  | "number"
  | "phone"
  | "url"
  | "rating"
  | "slider"
  | "datetime"
  | "dropdown";

export interface Question {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[]; // for radio / checkbox / dropdown
  min?: number;       // for scale / slider / number
  max?: number;       // for scale / slider / number
  step?: number;      // for number / slider
  placeholder?: string;
}

export interface Form {
  id: string;
  created_at: string;
  creator_id: string;
  creator_address: string;
  title: string;
  description: string | null;
  questions: Question[];
  aggregator_vault_uuid: string | null;
  is_active: boolean;
  whitelist_enabled: boolean;
  whitelist_identifier_label: string;
}

export interface SurveyResponse {
  id: string;
  created_at: string;
  form_id: string;
  response_vault_uuid: string;
}

export interface CreatorAccount {
  id: string;
  created_at: string;
  email: string;
  name?: string;
  wallet_address: string;
  encrypted_private_key: string;
  avatar_url?: string;
}

export interface FormAnswers {
  formId: string;
  answers: Record<string, unknown>;
  submittedAt: string;
}

export interface AggregatedResults {
  formId: string;
  totalResponses: number;
  answers: Record<string, unknown[]>;
}

export interface WhitelistEntry {
  id: string;
  created_at: string;
  form_id: string;
  identifier_hash: string;
  submitted_at: string | null;
}

export interface Database {
  public: {
    Tables: {
      forms: {
        Row: Form;
        Insert: Omit<Form, "id" | "created_at">;
        Update: Partial<Omit<Form, "id" | "created_at">>;
      };
      responses: {
        Row: SurveyResponse;
        Insert: Omit<SurveyResponse, "id" | "created_at">;
        Update: Partial<Omit<SurveyResponse, "id" | "created_at">>;
      };
      creator_accounts: {
        Row: CreatorAccount;
        Insert: Omit<CreatorAccount, "id" | "created_at">;
        Update: Partial<Omit<CreatorAccount, "id" | "created_at">>;
      };
      whitelist_entries: {
        Row: WhitelistEntry;
        Insert: Omit<WhitelistEntry, "id" | "created_at">;
        Update: Partial<Omit<WhitelistEntry, "id" | "created_at">>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
