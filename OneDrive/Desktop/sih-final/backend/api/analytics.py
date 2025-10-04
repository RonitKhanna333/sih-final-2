from fastapi import APIRouter, Depends
from datetime import datetime, timedelta, timezone
from typing import Dict, Any
from utils.database import get_prisma
from api.auth import get_admin_user

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


@router.get("/kpis")
async def get_kpis(current_user: dict = Depends(get_admin_user)) -> Dict[str, Any]:
    """
    Get Key Performance Indicators for the admin dashboard.
    
    Returns:
    - Total submissions
    - Average submissions per day
    - Sentiment breakdown (Positive, Negative, Neutral counts)
    - Total unique languages
    """
    
    prisma = get_prisma()
    
    # Get total feedback count
    total_feedback = await prisma.feedback.count()
    
    if total_feedback == 0:
        return {
            "totalSubmissions": 0,
            "averageSubmissionsPerDay": 0,
            "positiveFeedback": 0,
            "negativeFeedback": 0,
            "neutralFeedback": 0,
            "totalLanguages": 0,
            "totalStakeholderTypes": 0
        }
    
    # Get sentiment breakdown
    positive_count = await prisma.feedback.count(where={"sentiment": "Positive"})
    negative_count = await prisma.feedback.count(where={"sentiment": "Negative"})
    neutral_count = await prisma.feedback.count(where={"sentiment": "Neutral"})
    
    # Get first feedback submission date
    first_feedback = await prisma.feedback.find_first(
        order={"createdAt": "asc"}
    )
    
    # Calculate average submissions per day
    avg_per_day = 0
    if first_feedback:
        # Use timezone-aware datetime for comparison
        now = datetime.now(timezone.utc)
        days_since_first = (now - first_feedback.createdAt).days + 1
        avg_per_day = round(total_feedback / days_since_first, 2)
    
    # Get unique languages count
    all_feedback = await prisma.feedback.find_many()
    unique_languages = len(set(f.language for f in all_feedback if f.language))
    
    # Get unique stakeholder types count (reuse all_feedback to avoid extra query)
    unique_stakeholders = len(set(f.stakeholderType for f in all_feedback if f.stakeholderType))
    
    return {
        "totalSubmissions": total_feedback,
        "averageSubmissionsPerDay": avg_per_day,
        "positiveFeedback": positive_count,
        "negativeFeedback": negative_count,
        "neutralFeedback": neutral_count,
        "totalLanguages": unique_languages,
        "totalStakeholderTypes": unique_stakeholders
    }


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    Check the health status of critical system components.
    
    Returns status for:
    - Database connection
    - AI Models (sentiment, embeddings)
    - Groq API configuration
    """
    import os
    from utils.analysis import sentiment_model, embedding_model
    
    status = {}
    
    prisma = get_prisma()
    
    # Check database connection
    try:
        await prisma.feedback.count()
        status["database"] = "ok"
    except Exception as e:
        status["database"] = f"error: {str(e)}"
    
    # Check sentiment model
    if sentiment_model is not None:
        status["sentimentModel"] = "loaded"
    else:
        status["sentimentModel"] = "not_loaded"
    
    # Check embedding model
    if embedding_model is not None:
        status["embeddingModel"] = "loaded"
    else:
        status["embeddingModel"] = "not_loaded"
    
    # Check Groq API key
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and len(groq_key) > 0:
        status["groqApi"] = "configured"
    else:
        status["groqApi"] = "not_configured"
    
    return status
