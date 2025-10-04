"""FastAPI router for feedback endpoints"""
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import List
from datetime import datetime
import logging

from models import (
    FeedbackSubmitRequest,
    FeedbackResponse,
    AnalyticsResponse,
    SummaryResponse,
    ClusterRequest,
    ClusterResponse
)
from utils.database import (
    create_feedback,
    get_all_feedback,
    get_recent_feedback,
    get_analytics_data
)
from utils.analysis import (
    analyze_sentiment,
    detect_nuance,
    detect_language,
    detect_spam,
    compute_predictive_scores,
    detect_edge_case_flags,
    retrieve_similar_edge_case,
    summarize_feedback_with_ai,
    perform_clustering,
    generate_wordcloud_image,
    analyze_concern_patterns,
    generate_simple_summary
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/feedback", tags=["feedback"])


@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def submit_feedback(request: FeedbackSubmitRequest):
    """
    Submit new feedback for analysis.
    
    Performs comprehensive analysis including:
    - Sentiment analysis (Positive/Negative/Neutral)
    - Nuance detection (sarcasm, mixed sentiment, etc.)
    - Spam detection
    - Predictive risk scoring
    - Edge case similarity matching
    - Legal reference linking
    """
    try:
        # Detect language if not specified
        language = request.language or detect_language(request.text)
        
        # Core analyses
        sentiment = analyze_sentiment(request.text, language)
        nuances = detect_nuance(request.text, language)
        is_spam = detect_spam(request.text)
        edge_flags = detect_edge_case_flags(request.text)
        
        # Predictive scores
        scores = compute_predictive_scores(request.text)
        
        # RAG-style edge case retrieval
        edge_case_match = None
        if not is_spam:
            edge_case_match = retrieve_similar_edge_case(request.text)
        
        # Generate simple summary
        summary = generate_simple_summary(request.text)
        
        # Legal reference (simplified - use first 5 significant words)
        legal_ref = None
        # In production, you'd call search_legal_precedents here
        
        # Prepare feedback data
        feedback_data = {
            "text": request.text,
            "sentiment": sentiment,
            "language": language,
            "nuances": nuances,
            "isSpam": is_spam,
            "legalRiskScore": scores["legal_risk"],
            "complianceDifficultyScore": scores["compliance_diff"],
            "businessGrowthScore": scores["business_growth"],
            "stakeholderType": request.stakeholderType,
            "sector": request.sector,
            "summary": summary,
            "edgeCaseMatch": edge_case_match,
            "edgeCaseFlags": edge_flags,
            "legalReference": legal_ref,
            "policyId": request.policyId  # Add policy context
        }
        
        # Save to database
        created_feedback = await create_feedback(feedback_data)
        
        logger.info(f"Created feedback: {created_feedback['id']}")
        return created_feedback
        
    except Exception as e:
        logger.error(f"Failed to submit feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process feedback: {str(e)}"
        )


@router.get("/")
async def get_feedback(
    limit: int = 100, 
    offset: int = 0,
    page: int = 1,
    sentiment: str = None,
    language: str = None,
    search: str = None,
    isSpam: bool = None
):
    """
    Retrieve feedback with advanced filtering, pagination, and search.
    
    Query parameters:
    - limit: Maximum number of records per page (default: 100)
    - offset: Number of records to skip (default: 0)
    - page: Page number (alternative to offset)
    - sentiment: Filter by sentiment (Positive, Negative, Neutral)
    - language: Filter by language
    - search: Case-insensitive text search in feedback text
    - isSpam: Filter by spam status (true/false)
    """
    try:
        from utils.database import prisma
        
        # Calculate offset from page if page is provided
        if page > 1:
            offset = (page - 1) * limit
        
        # Build where clause for filtering
        where = {}
        
        if sentiment:
            where["sentiment"] = sentiment
        
        if language:
            where["language"] = language
        
        if isSpam is not None:
            where["isSpam"] = isSpam
        
        if search:
            where["text"] = {"contains": search, "mode": "insensitive"}
        
        # Get total count for pagination metadata
        total_count = await prisma.feedback.count(where=where)
        
        # Get filtered feedback
        feedbacks = await prisma.feedback.find_many(
            where=where,
            skip=offset,
            take=limit,
            order={"createdAt": "desc"}
        )
        
        # Calculate pagination metadata
        total_pages = (total_count + limit - 1) // limit
        current_page = (offset // limit) + 1
        
        return {
            "data": feedbacks,
            "pagination": {
                "total": total_count,
                "page": current_page,
                "limit": limit,
                "totalPages": total_pages,
                "hasNext": current_page < total_pages,
                "hasPrev": current_page > 1
            }
        }
    except Exception as e:
        logger.error(f"Failed to retrieve feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve feedback: {str(e)}"
        )


@router.get("/analytics/", response_model=AnalyticsResponse)
async def get_analytics():
    """
    Get aggregated analytics from all feedback.
    
    Returns:
    - Sentiment distribution (Positive/Negative/Neutral counts)
    - Historical concern patterns (compliance cost, implementation difficulty, etc.)
    - Total feedback count
    - Spam count
    - Average predictive scores
    """
    try:
        # Get base analytics from database
        analytics = await get_analytics_data()
        
        # Get all feedback texts for pattern analysis
        all_feedback = await get_all_feedback(limit=10000)
        texts = [fb["text"] for fb in all_feedback]
        
        # Analyze concern patterns
        concern_patterns = analyze_concern_patterns(texts)
        
        analytics["historicalConcernPatterns"] = concern_patterns
        
        return analytics
    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve analytics: {str(e)}"
        )


@router.post("/summary/", response_model=SummaryResponse)
async def generate_summary():
    """
    Generate AI-powered summary of recent feedback.
    
    Uses Groq AI to analyze the last 60 feedback items and generate:
    - Thematic clusters
    - Sentiment distribution
    - Actionable recommendations
    
    Falls back to heuristic summary if AI is unavailable.
    """
    try:
        # Get recent feedback
        recent_feedback = await get_recent_feedback(limit=60)
        
        if not recent_feedback:
            return SummaryResponse(
                summary="No feedback available to summarize.",
                feedbackCount=0,
                generatedAt=datetime.utcnow()
            )
        
        # Extract texts
        texts = [fb["text"] for fb in recent_feedback]
        
        # Generate AI summary
        summary_text = await summarize_feedback_with_ai(texts)
        
        return SummaryResponse(
            summary=summary_text,
            feedbackCount=len(recent_feedback),
            generatedAt=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Failed to generate summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )


@router.post("/cluster/", response_model=ClusterResponse)
async def cluster_feedback(request: ClusterRequest):
    """
    Perform KMeans clustering on all feedback.
    
    Groups similar feedback items together using sentence embeddings.
    Returns clusters with their member feedback items and a silhouette score.
    
    Request:
    - numClusters: Number of clusters to create (2-10)
    """
    try:
        # Get all feedback
        all_feedback = await get_all_feedback(limit=10000)
        
        if len(all_feedback) < request.numClusters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough feedback items for {request.numClusters} clusters"
            )
        
        # Extract texts
        texts = [fb["text"] for fb in all_feedback]
        
        # Perform clustering
        cluster_map, silhouette = perform_clustering(texts, n_clusters=request.numClusters)
        
        if cluster_map is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Clustering failed - not enough diversity in feedback"
            )
        
        # Build response: map cluster IDs to feedback items
        clusters_response = {}
        for cluster_id, indices in cluster_map.items():
            cluster_key = f"cluster_{cluster_id}"
            clusters_response[cluster_key] = [all_feedback[idx] for idx in indices]
        
        return ClusterResponse(
            clusters=clusters_response,
            silhouetteScore=silhouette,
            numClusters=len(cluster_map)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cluster feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clustering failed: {str(e)}"
        )


@router.get("/wordcloud/")
async def get_wordcloud():
    """
    Generate and return a word cloud image from all English feedback.
    
    Returns a PNG image showing the most frequent words in feedback.
    Hindi feedback is excluded to focus on English lexical patterns.
    """
    try:
        # Get all feedback
        all_feedback = await get_all_feedback(limit=10000)
        texts = [fb["text"] for fb in all_feedback]
        
        # Generate word cloud
        img_buffer = generate_wordcloud_image(texts)
        
        if img_buffer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No suitable feedback for word cloud generation"
            )
        
        return StreamingResponse(
            img_buffer,
            media_type="image/png",
            headers={"Content-Disposition": "inline; filename=wordcloud.png"}
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate word cloud: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Word cloud generation failed: {str(e)}"
        )


@router.put("/{feedback_id}")
async def update_feedback(feedback_id: str, text: str = None, sentiment: str = None):
    """
    Update an existing feedback entry.
    
    Path parameters:
    - feedback_id: UUID of the feedback to update
    
    Body parameters:
    - text: Updated feedback text (optional)
    - sentiment: Updated sentiment (optional)
    """
    try:
        from utils.database import prisma
        
        # Check if feedback exists
        existing = await prisma.feedback.find_unique(where={"id": feedback_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Feedback with id {feedback_id} not found"
            )
        
        # Build update data
        update_data = {}
        if text is not None:
            update_data["text"] = text
        if sentiment is not None:
            update_data["sentiment"] = sentiment
        
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No update data provided"
            )
        
        # Update feedback
        updated = await prisma.feedback.update(
            where={"id": feedback_id},
            data=update_data
        )
        
        logger.info(f"Updated feedback: {feedback_id}")
        return updated
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update feedback: {str(e)}"
        )


@router.delete("/{feedback_id}")
async def delete_feedback(feedback_id: str):
    """
    Delete a feedback entry.
    
    Path parameters:
    - feedback_id: UUID of the feedback to delete
    """
    try:
        from utils.database import prisma
        
        # Check if feedback exists
        existing = await prisma.feedback.find_unique(where={"id": feedback_id})
        if not existing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Feedback with id {feedback_id} not found"
            )
        
        # Delete feedback
        await prisma.feedback.delete(where={"id": feedback_id})
        
        logger.info(f"Deleted feedback: {feedback_id}")
        return {"message": "Feedback deleted successfully", "id": feedback_id}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete feedback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete feedback: {str(e)}"
        )


@router.post("/summarize-filtered")
async def summarize_filtered_feedback(
    sentiment: str = None,
    language: str = None,
    start_date: str = None,
    end_date: str = None,
    limit: int = 100
):
    """
    Generate AI summary of filtered feedback.
    
    Body parameters:
    - sentiment: Filter by sentiment (optional)
    - language: Filter by language (optional)
    - start_date: Filter by start date ISO format (optional)
    - end_date: Filter by end date ISO format (optional)
    - limit: Maximum feedback items to analyze (default: 100)
    """
    try:
        from utils.database import prisma
        from datetime import datetime
        
        # Build where clause
        where = {}
        if sentiment:
            where["sentiment"] = sentiment
        if language:
            where["language"] = language
        
        if start_date or end_date:
            date_filter = {}
            if start_date:
                date_filter["gte"] = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            if end_date:
                date_filter["lte"] = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            where["createdAt"] = date_filter
        
        # Get filtered feedback
        filtered_feedback = await prisma.feedback.find_many(
            where=where,
            take=limit,
            order={"createdAt": "desc"}
        )
        
        if not filtered_feedback:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No feedback found matching the filters"
            )
        
        # Extract texts and generate summary
        texts = [fb.text for fb in filtered_feedback]
        summary_text = await summarize_feedback_with_ai(texts)
        
        return {
            "summary": summary_text,
            "feedbackCount": len(filtered_feedback),
            "filters": {
                "sentiment": sentiment,
                "language": language,
                "startDate": start_date,
                "endDate": end_date
            },
            "generatedAt": datetime.utcnow()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to generate filtered summary: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate summary: {str(e)}"
        )
