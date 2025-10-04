"""Policy Management API - Create, Read, Update policies for consultation"""
from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel
import logging
from datetime import datetime

from utils.database import get_prisma

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/policy", tags=["policy"])


# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class PolicyCreateRequest(BaseModel):
    """Request to create a new policy"""
    title: str
    description: str
    fullText: str
    category: Optional[str] = None
    version: str = "1.0"
    status: str = "draft"


class PolicyResponse(BaseModel):
    """Policy response model"""
    id: str
    title: str
    description: str
    fullText: str
    version: str
    status: str
    category: Optional[str]
    createdAt: datetime
    updatedAt: datetime
    feedbackCount: int = 0


class PolicyListResponse(BaseModel):
    """List of policies"""
    data: List[PolicyResponse]
    total: int


# ============================================================================
# POLICY ENDPOINTS
# ============================================================================

@router.get("/list", response_model=PolicyListResponse)
async def list_policies(
    status: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Get list of all policies with optional filtering
    
    Args:
        status: Filter by status (draft, active, archived)
        limit: Maximum number of results
        offset: Number of results to skip
    """
    try:
        prisma = get_prisma()
        where = {}
        if status:
            where["status"] = status

        policies = await prisma.policy.find_many(
            where=where,
            take=limit,
            skip=offset,
            order={"createdAt": "desc"}
        )
        
        total = await prisma.policy.count(where=where)
        
        policy_responses = []
        for p in policies:
            feedback_count = await prisma.feedback.count(
                where={"policyId": p.id}
            )
            policy_responses.append(
                PolicyResponse(
                    id=p.id,
                    title=p.title,
                    description=p.description,
                    fullText=p.fullText,
                    version=p.version,
                    status=p.status,
                    category=p.category,
                    createdAt=p.createdAt,
                    updatedAt=p.updatedAt,
                    feedbackCount=feedback_count
                )
            )
        
        return PolicyListResponse(data=policy_responses, total=total)
    
    except Exception as e:
        logger.error(f"Error listing policies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{policy_id}", response_model=PolicyResponse)
async def get_policy(policy_id: str):
    """
    Get a specific policy by ID
    
    Args:
        policy_id: UUID of the policy
    """
    try:
        prisma = get_prisma()
        policy = await prisma.policy.find_unique(
            where={"id": policy_id}
        )
        
        if not policy:
            raise HTTPException(status_code=404, detail="Policy not found")
        
        # Count feedbacks separately
        feedback_count = await prisma.feedback.count(
            where={"policyId": policy.id}
        )
        
        return PolicyResponse(
            id=policy.id,
            title=policy.title,
            description=policy.description,
            fullText=policy.fullText,
            version=policy.version,
            status=policy.status,
            category=policy.category,
            createdAt=policy.createdAt,
            updatedAt=policy.updatedAt,
            feedbackCount=feedback_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting policy {policy_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create", response_model=PolicyResponse)
async def create_policy(request: PolicyCreateRequest):
    """
    Create a new policy for consultation
    
    Args:
        request: Policy creation request
    """
    try:
        prisma = get_prisma()
        policy = await prisma.policy.create(
            data={
                "title": request.title,
                "description": request.description,
                "fullText": request.fullText,
                "version": request.version,
                "status": request.status,
                "category": request.category
            }
        )
        
        return PolicyResponse(
            id=policy.id,
            title=policy.title,
            description=policy.description,
            fullText=policy.fullText,
            version=policy.version,
            status=policy.status,
            category=policy.category,
            createdAt=policy.createdAt,
            updatedAt=policy.updatedAt,
            feedbackCount=0
        )
    
    except Exception as e:
        logger.error(f"Error creating policy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{policy_id}/status")
async def update_policy_status(policy_id: str, status: str):
    """
    Update policy status (draft -> active -> archived)
    
    Args:
        policy_id: UUID of the policy
        status: New status (draft, active, archived)
    """
    try:
        prisma = get_prisma()
        if status not in ["draft", "active", "archived"]:
            raise HTTPException(status_code=400, detail="Invalid status")
        
        policy = await prisma.policy.update(
            where={"id": policy_id},
            data={"status": status}
        )
        
        return {"success": True, "policyId": policy.id, "newStatus": policy.status}
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating policy status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/active/current", response_model=PolicyResponse)
async def get_active_policy():
    """
    Get the current active policy for consultation
    Returns the most recently activated policy
    """
    try:
        prisma = get_prisma()
        policy = await prisma.policy.find_first(
            where={"status": "active"},
            order={"updatedAt": "desc"}
        )
        
        if not policy:
            raise HTTPException(status_code=404, detail="No active policy found")
        
        # Count feedbacks separately
        feedback_count = await prisma.feedback.count(
            where={"policyId": policy.id}
        ) if policy else 0
        
        return PolicyResponse(
            id=policy.id,
            title=policy.title,
            description=policy.description,
            fullText=policy.fullText,
            version=policy.version,
            status=policy.status,
            category=policy.category,
            createdAt=policy.createdAt,
            updatedAt=policy.updatedAt,
            feedbackCount=feedback_count
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting active policy: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
