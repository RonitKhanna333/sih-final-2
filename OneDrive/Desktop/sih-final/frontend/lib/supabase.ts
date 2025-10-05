/**
 * Supabase client configuration
 * Replaces Prisma for easier deployment and better connectivity
 */
import { createClient } from '@supabase/supabase-js';

type GenericDatabase = {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
    CompositeTypes: Record<string, unknown>;
  };
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminSupabaseUrl = process.env.SUPABASE_URL ?? supabaseUrl;

export const supabase = createClient<GenericDatabase>(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient<GenericDatabase>(adminSupabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Database table types for TypeScript
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'client';
  password?: string; // Only for auth, not stored in profile
  createdAt: string;
  updatedAt: string;
}

export interface Feedback {
  id: string;
  text: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  language: string;
  nuances: string[];
  isSpam: boolean;
  legalRiskScore: number;
  complianceDifficultyScore: number;
  businessGrowthScore: number;
  stakeholderType?: string | null;
  sector?: string | null;
  edgeCaseFlags: string[];
  policyId?: string | null;
  summary: string;
  createdAt: string;
  updatedAt: string;
  reasoning?: string;
  sentimentConfidence?: number;
}

export interface FeedbackInsert {
  text: string;
  sentiment?: string;
  language?: string;
  nuances?: string[];
  isSpam?: boolean;
  legalRiskScore?: number;
  complianceDifficultyScore?: number;
  businessGrowthScore?: number;
  stakeholderType?: string | null;
  sector?: string | null;
  policyId?: string | null;
  edgeCaseFlags?: string[];
  summary?: string;
  reasoning?: string;
  sentimentConfidence?: number;
  embedding?: number[];
}

export interface Policy {
  id: string;
  title: string;
  description?: string;
  fullText?: string;
  version?: string;
  category?: string | null;
  status: 'draft' | 'review' | 'published' | 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}