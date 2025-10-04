"""Database utility functions for Prisma integration"""
from typing import List, Dict, Any, Optional
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)

# Prisma client will be initialized in main.py lifespan
prisma_client = None

# Alias for backward compatibility with imports
prisma = None


def set_prisma_client(client):
    """Set the global Prisma client instance"""
    global prisma_client, prisma
    prisma_client = client
    prisma = client  # Set alias as well


def get_prisma():
    """Get the Prisma client instance"""
    if prisma_client is None:
        raise RuntimeError("Prisma client not initialized. Call set_prisma_client() first.")
    return prisma_client


async def create_feedback(feedback_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new feedback record in the database"""
    try:
        # Prepare data dictionary
        data = {
            "text": feedback_data["text"],
            "sentiment": feedback_data["sentiment"],
            "language": feedback_data["language"],
            "nuances": feedback_data.get("nuances", []),
            "isSpam": feedback_data.get("isSpam", False),
            "legalRiskScore": feedback_data.get("legalRiskScore", 0),
            "complianceDifficultyScore": feedback_data.get("complianceDifficultyScore", 0),
            "businessGrowthScore": feedback_data.get("businessGrowthScore", 0),
            "edgeCaseFlags": feedback_data.get("edgeCaseFlags", []),
        }
        
        # Add optional string fields only if they exist
        if feedback_data.get("stakeholderType"):
            data["stakeholderType"] = feedback_data["stakeholderType"]
        if feedback_data.get("sector"):
            data["sector"] = feedback_data["sector"]
        if feedback_data.get("summary"):
            data["summary"] = feedback_data["summary"]
        if feedback_data.get("edgeCaseMatch"):
            data["edgeCaseMatch"] = feedback_data["edgeCaseMatch"]
        
        # Add legalReference as JSON only if it exists
        if feedback_data.get("legalReference"):
            data["legalReference"] = json.dumps(feedback_data["legalReference"])
        
        feedback = await prisma_client.feedback.create(data=data)
        return feedback.dict()
    except Exception as e:
        logger.error(f"Failed to create feedback: {e}")
        raise


async def get_all_feedback(limit: int = 1000, offset: int = 0) -> List[Dict[str, Any]]:
    """Retrieve all feedback records, ordered by most recent first"""
    try:
        feedbacks = await prisma_client.feedback.find_many(
            order={"createdAt": "desc"},
            take=limit,
            skip=offset
        )
        return [f.dict() for f in feedbacks]
    except Exception as e:
        logger.error(f"Failed to retrieve feedback: {e}")
        raise


async def get_feedback_by_id(feedback_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve a single feedback record by ID"""
    try:
        feedback = await prisma_client.feedback.find_unique(
            where={"id": feedback_id}
        )
        return feedback.dict() if feedback else None
    except Exception as e:
        logger.error(f"Failed to retrieve feedback by ID: {e}")
        raise


async def get_recent_feedback(limit: int = 60) -> List[Dict[str, Any]]:
    """Get the most recent feedback items"""
    return await get_all_feedback(limit=limit, offset=0)


async def search_legal_precedents(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """Search legal precedents with keyword matching"""
    try:
        # Get all precedents (in production, use full-text search)
        precedents = await prisma_client.legalprecedent.find_many()
        
        # Simple keyword scoring
        q_lower = query.lower()
        scored = []
        
        for prec in precedents:
            text = f"{prec.caseName} {prec.keywords} {prec.summary}".lower()
            score = sum(1 for word in q_lower.split() if word in text) / (len(q_lower.split()) or 1)
            if score > 0:
                scored.append((score, prec))
        
        # Sort by score and return top K
        scored.sort(reverse=True, key=lambda x: x[0])
        results = []
        
        for score, prec in scored[:top_k]:
            result = prec.dict()
            result["score"] = round(score, 2)
            results.append(result)
        
        return results
    except Exception as e:
        logger.error(f"Failed to search legal precedents: {e}")
        raise


async def seed_legal_precedents():
    """Seed initial legal precedents if database is empty"""
    try:
        count = await prisma_client.legalprecedent.count()
        if count == 0:
            logger.info("Seeding legal precedents...")
            
            precedents = [
                {
                    "caseName": "GDPR Compliance Act",
                    "jurisdiction": "EU",
                    "year": 2018,
                    "keywords": "data privacy,user consent,data protection",
                    "summary": "Comprehensive data protection regulation for EU",
                    "relevance": 0.9
                },
                {
                    "caseName": "California Privacy Act",
                    "jurisdiction": "US",
                    "year": 2020,
                    "keywords": "data portability,user rights",
                    "summary": "Established data portability rights",
                    "relevance": 0.8
                },
                {
                    "caseName": "Data Breach Notification Act",
                    "jurisdiction": "US",
                    "year": 2018,
                    "keywords": "breach notification,disclosure",
                    "summary": "Mandated 72h breach notification",
                    "relevance": 0.85
                }
            ]
            
            for prec_data in precedents:
                await prisma_client.legalprecedent.create(data=prec_data)
            
            logger.info(f"Seeded {len(precedents)} legal precedents")
    except Exception as e:
        logger.error(f"Failed to seed legal precedents: {e}")


async def get_analytics_data() -> Dict[str, Any]:
    """Get aggregated analytics data"""
    try:
        # Get all feedback
        all_feedback = await prisma_client.feedback.find_many()
        
        # Sentiment distribution
        sentiment_dist = {"Positive": 0, "Negative": 0, "Neutral": 0}
        spam_count = 0
        total_legal_risk = 0
        total_compliance = 0
        total_business = 0
        
        for fb in all_feedback:
            sentiment_dist[fb.sentiment] = sentiment_dist.get(fb.sentiment, 0) + 1
            if fb.isSpam:
                spam_count += 1
            total_legal_risk += fb.legalRiskScore
            total_compliance += fb.complianceDifficultyScore
            total_business += fb.businessGrowthScore
        
        count = len(all_feedback) or 1
        
        return {
            "sentimentDistribution": sentiment_dist,
            "totalFeedback": len(all_feedback),
            "spamCount": spam_count,
            "averageLegalRisk": round(total_legal_risk / count, 2),
            "averageComplianceDifficulty": round(total_compliance / count, 2),
            "averageBusinessGrowth": round(total_business / count, 2)
        }
    except Exception as e:
        logger.error(f"Failed to get analytics data: {e}")
        raise


# ------------- User Authentication Functions ------------- #

async def create_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new user"""
    try:
        user = await prisma_client.user.create(
            data={
                "email": user_data["email"],
                "password": user_data["password"],
                "name": user_data["name"],
                "role": user_data.get("role", "client")
            }
        )
        return user.dict()
    except Exception as e:
        logger.error(f"Failed to create user: {e}")
        raise


async def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Get user by email address"""
    try:
        user = await prisma_client.user.find_unique(where={"email": email})
        return user.dict() if user else None
    except Exception as e:
        logger.error(f"Failed to get user by email: {e}")
        raise


async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    try:
        user = await prisma_client.user.find_unique(where={"id": user_id})
        return user.dict() if user else None
    except Exception as e:
        logger.error(f"Failed to get user by ID: {e}")
        raise
