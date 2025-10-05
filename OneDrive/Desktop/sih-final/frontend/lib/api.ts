/**
 * API client for frontend communication with Next.js API routes
 * No external backend needed - uses internal /api/* endpoints
 */
import axios from 'axios';

// Use relative URLs for API routes within the same Next.js app
const API_BASE_URL = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// ============= Type Definitions ============= //

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
  stakeholderType?: string;
  sector?: string;
  summary?: string;
  edgeCaseMatch?: string;
  edgeCaseFlags: string[];
  legalReference?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  sentimentConfidence?: number;
  reasoning?: string;
}

export interface FeedbackSubmitRequest {
  text: string;
  language?: string;
  stakeholderType?: string;
  sector?: string;
  policyId?: string;
}

export interface AnalyticsResponse {
  sentimentDistribution: {
    Positive: number;
    Negative: number;
    Neutral: number;
  };
  historicalConcernPatterns: {
    [key: string]: {
      count: number;
      percent: number;
    };
  };
  totalFeedback: number;
  spamCount: number;
  averageLegalRisk: number;
  averageComplianceDifficulty: number;
  averageBusinessGrowth: number;
}

export interface SummaryResponse {
  summary: string;
  feedbackCount: number;
  generatedAt: string;
}

export interface ClusterResponse {
  clusters: {
    [key: string]: Feedback[];
  };
  silhouetteScore?: number;
  numClusters: number;
  narrative?: string;
}

export interface LegalPrecedent {
  id: string;
  caseName: string;
  jurisdiction: string;
  year: number;
  keywords: string;
  summary: string;
  relevance: number;
  createdAt: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface FeedbackListResponse {
  data: Feedback[];
  pagination: PaginationData;
}

export interface DebateMapPoint {
  id: string;
  x: number;
  y: number;
  clusterId: number;
  text: string;
  sentiment: string;
  stakeholderType: string | null;
}

export interface DebateMapCluster {
  id: number;
  label: string;
  size: number;
  averageSentiment: string;
  keyThemes: string[];
  color: string;
}

export interface ConflictZone {
  cluster1: string;
  cluster2: string;
  description: string;
}

export interface DebateMapResponse {
  points: DebateMapPoint[];
  clusters: DebateMapCluster[];
  narrative: string;
  conflictZones: ConflictZone[];
  consensusAreas: string[];
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  fullText: string;
  version: string;
  status: 'draft' | 'active' | 'archived';
  category?: string;
  createdAt: string;
  updatedAt: string;
  feedbackCount: number;
}

export interface PolicyListResponse {
  data: Policy[];
  total: number;
}

// ============= API Functions ============= //

export const feedbackAPI = {
  // Submit new feedback
  submit: async (data: FeedbackSubmitRequest): Promise<Feedback> => {
    const response = await apiClient.post<Feedback>('/feedback', data);
    return response.data;
  },

  // Get all feedback
  getAll: async (limit = 100, offset = 0, policyId?: string): Promise<FeedbackListResponse> => {
    const response = await apiClient.get<FeedbackListResponse>('/feedback', {
      params: { limit, offset, policyId },
    });
    return response.data;
  },

  // Get analytics
  getAnalytics: async (policyId?: string): Promise<AnalyticsResponse> => {
    const response = await apiClient.get<AnalyticsResponse>('/feedback/analytics', {
      params: policyId ? { policyId } : {},
    });
    return response.data;
  },

  // Generate summary
  generateSummary: async (policyId?: string): Promise<SummaryResponse> => {
    const response = await apiClient.get<SummaryResponse>('/summary', {
      params: policyId ? { policyId } : {},
    });
    return response.data;
  },

  // Perform clustering
  cluster: async (numClusters: number, policyId?: string): Promise<ClusterResponse> => {
    const response = await apiClient.post<ClusterResponse>('/clustering', {
      num_clusters: numClusters,
      policyId,
    });
    return response.data;
  },

  // Get word cloud URL
  getWordCloudUrl: (policyId?: string, language = 'English'): string => {
    const params = new URLSearchParams();
    if (policyId) params.set('policyId', policyId);
    params.set('language', language);
    return `/api/wordcloud?${params.toString()}`;
  },
};

export const legalAPI = {
  // Search legal precedents
  search: async (query: string, topK = 5): Promise<LegalPrecedent[]> => {
    const response = await apiClient.get<LegalPrecedent[]>('/api/v1/legal/search/', {
      params: { q: query, top_k: topK },
    });
    return response.data;
  },
};

export const healthAPI = {
  // Health check
  check: async (): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>('/health');
    return response.data;
  },
};

export const policyAPI = {
  // Get all policies
  getAll: async (status?: string, limit = 100, offset = 0): Promise<PolicyListResponse> => {
    const response = await apiClient.get<PolicyListResponse>('/policy', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  // Get specific policy by ID
  getById: async (policyId: string): Promise<Policy> => {
    const response = await apiClient.get<Policy>(`/policy/${policyId}`);
    return response.data;
  },

  // Get current active policy
  getActive: async (): Promise<Policy> => {
    const response = await apiClient.get<Policy>('/policy/active');
    return response.data;
  },

  // Create new policy
  create: async (data: {
    title: string;
    description: string;
    fullText: string;
    category?: string;
    version?: string;
    status?: string;
  }): Promise<Policy> => {
    const response = await apiClient.post<Policy>('/policy', data);
    return response.data;
  },
  // Update policy status
  updateStatus: async (policyId: string, status: string): Promise<Policy> => {
    const response = await apiClient.patch<Policy>(`/policy/${policyId}`, { status });
    return response.data;
  },
};

// ============= Authentication ============= //

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'client';
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface RegisterResponse {
  message: string;
  user: LoginResponse['user'];
}

export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },
};

// Chat assistant API
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface ChatReply { reply: string; usedContext: number; model?: string; degraded: boolean }

export const assistantAPI = {
  chat: async (messages: ChatMessage[], options?: { sentimentFocus?: string }) => {
    const payload = {
      messages,
      sentimentFocus: options?.sentimentFocus,
      includeContext: true,
      maxHistory: 10,
    }
    const res = await apiClient.post<ChatReply>('/ai/assistant/chat', payload)
    return res.data
  }
}

// Optional: debate map API wrapper for consistent auth handling
export const aiAnalyticsAPI = {
  async getDebateMap(regenerate = false, policyId?: string) {
    const params: Record<string, string | number | boolean> = { regenerate };
    if (policyId) {
      params.policyId = policyId;
    }
    const res = await apiClient.get<DebateMapResponse>('/ai/analytics/debate-map', { params });
    return res.data;
  },
};
