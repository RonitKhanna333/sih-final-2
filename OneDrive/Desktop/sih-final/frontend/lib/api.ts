/**
 * API client for frontend communication with the FastAPI backend
 */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

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
  legalReference?: any;
  createdAt: string;
  updatedAt: string;
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
    const response = await apiClient.post<Feedback>('/api/v1/feedback/', data);
    return response.data;
  },

  // Get all feedback
  getAll: async (limit = 100, offset = 0): Promise<FeedbackListResponse> => {
    const response = await apiClient.get<FeedbackListResponse>('/api/v1/feedback/', {
      params: { limit, offset },
    });
    return response.data;
  },

  // Get analytics
  getAnalytics: async (): Promise<AnalyticsResponse> => {
    const response = await apiClient.get<AnalyticsResponse>('/api/v1/feedback/analytics/');
    return response.data;
  },

  // Generate summary
  generateSummary: async (): Promise<SummaryResponse> => {
    const response = await apiClient.post<SummaryResponse>('/api/v1/feedback/summary/');
    return response.data;
  },

  // Perform clustering
  cluster: async (numClusters: number): Promise<ClusterResponse> => {
    const response = await apiClient.post<ClusterResponse>('/api/v1/feedback/cluster/', {
      numClusters,
    });
    return response.data;
  },

  // Get word cloud URL
  getWordCloudUrl: (): string => {
    return `${API_BASE_URL}/api/v1/feedback/wordcloud/`;
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
  check: async (): Promise<any> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

export const policyAPI = {
  // Get all policies
  getAll: async (status?: string, limit = 100, offset = 0): Promise<PolicyListResponse> => {
    const response = await apiClient.get<PolicyListResponse>('/api/v1/policy/list', {
      params: { status, limit, offset },
    });
    return response.data;
  },

  // Get specific policy by ID
  getById: async (policyId: string): Promise<Policy> => {
    const response = await apiClient.get<Policy>(`/api/v1/policy/${policyId}`);
    return response.data;
  },

  // Get current active policy
  getActive: async (): Promise<Policy> => {
    const response = await apiClient.get<Policy>('/api/v1/policy/active/current');
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
    const response = await apiClient.post<Policy>('/api/v1/policy/create', data);
    return response.data;
  },
  // Update policy status
  updateStatus: async (policyId: string, status: string): Promise<any> => {
    const response = await apiClient.patch(`/api/v1/policy/${policyId}/status`, null, {
      params: { status },
    });
    return response.data;
  },
};

// Chat assistant API
export interface ChatMessage { role: 'user' | 'assistant'; content: string }
export interface ChatReply { reply: string; usedContext: number; model?: string; degraded: boolean }

export const assistantAPI = {
  chat: async (messages: ChatMessage[], options?: { sentimentFocus?: string }) => {
    const token = localStorage.getItem('token')
    const payload = {
      messages,
      sentimentFocus: options?.sentimentFocus,
      includeContext: true,
      maxHistory: 10,
    }
    const res = await apiClient.post('/api/v1/ai/assistant/chat', payload, {
      headers: { Authorization: `Bearer ${token}` }
    })
    return res.data as ChatReply
  }
}

// Optional: debate map API wrapper for consistent auth handling
export const aiAnalyticsAPI = {
  async getDebateMap(regenerate = false) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const res = await apiClient.get(`/api/v1/ai/analytics/debate-map?regenerate=${regenerate}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    return res.data;
  },
};
