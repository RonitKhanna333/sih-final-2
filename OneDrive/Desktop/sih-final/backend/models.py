"""Pydantic models for request/response validation"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, validator
from datetime import datetime


# ------------- Request Models ------------- #

class FeedbackSubmitRequest(BaseModel):
    """Request model for submitting new feedback"""
    text: str = Field(..., min_length=1, max_length=10000, description="Feedback text")
    language: str = Field(default="English", description="Language of the feedback")
    stakeholderType: Optional[str] = Field(None, description="Type of stakeholder")
    sector: Optional[str] = Field(None, description="Sector/industry")
    policyId: Optional[str] = Field(None, description="ID of policy being commented on")

    @validator('language')
    def validate_language(cls, v):
        allowed = ['English', 'Hindi']
        if v not in allowed:
            return 'English'  # Default to English
        return v


class ClusterRequest(BaseModel):
    """Request model for clustering feedback"""
    numClusters: int = Field(default=3, ge=2, le=10, description="Number of clusters")


class LegalSearchRequest(BaseModel):
    """Request model for legal precedent search"""
    query: str = Field(..., min_length=1, max_length=500, description="Search query")
    topK: int = Field(default=5, ge=1, le=20, description="Number of results")


# ------------- Response Models ------------- #

class PredictiveScores(BaseModel):
    """Predictive risk/impact scores"""
    legalRiskScore: int = Field(..., ge=0, le=100)
    complianceDifficultyScore: int = Field(..., ge=0, le=100)
    businessGrowthScore: int = Field(..., ge=0, le=100)


class LegalReferenceResponse(BaseModel):
    """Legal precedent reference"""
    case: str
    jurisdiction: str
    year: int
    keywords: str
    summary: str
    score: float


class FeedbackResponse(BaseModel):
    """Response model for feedback items"""
    id: str
    text: str
    sentiment: str
    language: str
    nuances: List[str]
    isSpam: bool
    legalRiskScore: int
    complianceDifficultyScore: int
    businessGrowthScore: int
    stakeholderType: Optional[str]
    sector: Optional[str]
    summary: Optional[str]
    edgeCaseMatch: Optional[str]
    edgeCaseFlags: List[str]
    legalReference: Optional[Dict[str, Any]]
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class SentimentDistribution(BaseModel):
    """Sentiment distribution statistics"""
    Positive: int = 0
    Negative: int = 0
    Neutral: int = 0


class ConcernPattern(BaseModel):
    """Concern pattern statistics"""
    count: int
    percent: float


class AnalyticsResponse(BaseModel):
    """Response model for analytics aggregation"""
    sentimentDistribution: SentimentDistribution
    historicalConcernPatterns: Dict[str, ConcernPattern]
    totalFeedback: int
    spamCount: int
    averageLegalRisk: float
    averageComplianceDifficulty: float
    averageBusinessGrowth: float


class SummaryResponse(BaseModel):
    """Response model for AI-generated summary"""
    summary: str
    feedbackCount: int
    generatedAt: datetime


class ClusterResponse(BaseModel):
    """Response model for clustering results"""
    clusters: Dict[str, List[FeedbackResponse]]
    silhouetteScore: Optional[float] = None
    numClusters: int


class LegalPrecedentResponse(BaseModel):
    """Response model for legal precedent"""
    id: str
    caseName: str
    jurisdiction: str
    year: int
    keywords: str
    summary: str
    relevance: float
    createdAt: datetime

    class Config:
        from_attributes = True


class HealthCheckResponse(BaseModel):
    """Health check response"""
    status: str
    modelsLoaded: Dict[str, bool]
    databaseConnected: bool
    timestamp: datetime


# ------------- Authentication Models ------------- #

class RegisterRequest(BaseModel):
    """Request model for user registration"""
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=6, description="User password")
    name: str = Field(..., min_length=1, description="User full name")
    role: Optional[str] = Field(default="client", description="User role: admin or client")

    @validator('role')
    def validate_role(cls, v):
        if v not in ['admin', 'client']:
            return 'client'
        return v


class LoginRequest(BaseModel):
    """Request model for user login"""
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class UserResponse(BaseModel):
    """Response model for user information"""
    id: str
    email: str
    name: str
    role: str


class AuthResponse(BaseModel):
    """Response model for authentication (login/register)"""
    accessToken: str
    user: UserResponse


class ErrorResponse(BaseModel):
    """Generic error response"""
    detail: str

