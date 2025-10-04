"""FastAPI router for legal precedent search"""
from fastapi import APIRouter, HTTPException, status, Query
from typing import List
import logging

from models import LegalPrecedentResponse
from utils.database import search_legal_precedents

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/legal", tags=["legal"])


@router.get("/search/", response_model=List[LegalPrecedentResponse])
async def search_legal(
    q: str = Query(..., min_length=1, max_length=500, description="Search query"),
    top_k: int = Query(5, ge=1, le=20, description="Number of results to return")
):
    """
    Search legal precedents by keyword matching.
    
    Searches across case names, jurisdictions, keywords, and summaries
    to find relevant legal precedents.
    
    Query parameters:
    - q: Search query string
    - top_k: Maximum number of results (default: 5)
    """
    try:
        results = await search_legal_precedents(q, top_k=top_k)
        return results
    except Exception as e:
        logger.error(f"Failed to search legal precedents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Legal search failed: {str(e)}"
        )
