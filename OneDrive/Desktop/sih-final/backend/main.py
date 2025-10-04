"""FastAPI main application with lifespan management"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prisma import Prisma
import logging
import os
from datetime import datetime

from api import feedback, legal, auth, analytics, ai_features, policy
from utils import analysis, database
from models import HealthCheckResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global state
app_state = {
    "models_loaded": {
        "sentiment": False,
        "embeddings": False
    },
    "database_connected": False
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    Loads ML models and initializes database connection.
    """
    logger.info("Starting application initialization...")
    
    # Initialize Prisma database
    try:
        prisma = Prisma()
        await prisma.connect()
        database.set_prisma_client(prisma)
        app_state["database_connected"] = True
        logger.info("✓ Database connected")
        
        # Seed legal precedents if needed
        await database.seed_legal_precedents()
    except Exception as e:
        logger.error(f"✗ Database connection failed: {e}")
        app_state["database_connected"] = False
    
    # Load ML models
    try:
        logger.info("Loading sentiment analysis model...")
        if analysis.load_sentiment_model():
            app_state["models_loaded"]["sentiment"] = True
            logger.info("✓ Sentiment model loaded")
        else:
            logger.warning("✗ Sentiment model failed to load")
    except Exception as e:
        logger.error(f"✗ Sentiment model error: {e}")
    
    try:
        logger.info("Loading embedding model...")
        if analysis.load_embedding_model():
            app_state["models_loaded"]["embeddings"] = True
            logger.info("✓ Embedding model loaded")
        else:
            logger.warning("✗ Embedding model failed to load")
    except Exception as e:
        logger.error(f"✗ Embedding model error: {e}")
    
    # Load edge cases for RAG
    try:
        analysis.load_edge_cases("edge_cases.txt")
        logger.info("✓ Edge cases loaded (if file exists)")
    except Exception as e:
        logger.warning(f"Edge cases not loaded: {e}")
    
    logger.info("Application startup complete!")
    # Schedule async LLM warmup (non-blocking)
    try:
        ai_features.schedule_llm_warmup()
    except Exception as e:
        logger.warning(f"LLM warmup scheduling failed: {e}")
    
    yield
    
    # Shutdown: disconnect from database
    logger.info("Shutting down application...")
    try:
        if app_state["database_connected"]:
            await prisma.disconnect()
            logger.info("✓ Database disconnected")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")


# Create FastAPI application
app = FastAPI(
    title="eConsultation AI Analytics API",
    description="Backend API for multilingual sentiment analysis, feedback processing, and policy analytics",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(feedback.router)
app.include_router(legal.router)
app.include_router(auth.router)
app.include_router(analytics.router)
app.include_router(ai_features.router)
app.include_router(policy.router)


@app.get("/", tags=["root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "eConsultation AI Analytics API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthCheckResponse, tags=["health"])
async def health_check():
    """
    Health check endpoint.
    
    Returns the status of ML models and database connection.
    """
    return HealthCheckResponse(
        status="healthy" if app_state["database_connected"] else "degraded",
        modelsLoaded=app_state["models_loaded"],
        databaseConnected=app_state["database_connected"],
        timestamp=datetime.utcnow()
    )


if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )
