"""Utility functions for sentiment analysis, NLP, and data processing
Ported from the Streamlit application with enhancements for FastAPI
"""
import os
import re
import json
from typing import List, Dict, Any, Tuple, Optional
from collections import Counter
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import httpx
from wordcloud import WordCloud
from io import BytesIO
import logging

logger = logging.getLogger(__name__)

# Global model references (loaded at startup)
sent_tokenizer = None
sent_model = None
embedder = None
edge_case_chunks: List[str] = []
edge_case_embeddings: Optional[np.ndarray] = None

# Aliases for backward compatibility with imports
sentiment_model = None  # Alias for sent_model
embedding_model = None  # Alias for embedder

# Configuration
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL_CANDIDATES = [
    "llama-3.3-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768"
]

HISTORICAL_CONCERN_PATTERNS = {
    "compliance_cost": ["expensive", "costly", "burden", "overhead", "financial"],
    "implementation_difficulty": ["complex", "difficult", "unclear", "ambiguous", "confusing"],
    "business_impact": ["revenue", "growth", "competitiveness", "innovation", "market"],
    "privacy_concerns": ["privacy", "data protection", "surveillance", "tracking", "personal data"]
}


# ------------- Model Loading Functions ------------- #

def load_sentiment_model():
    """Load multilingual sentiment analysis model"""
    global sent_tokenizer, sent_model, sentiment_model
    try:
        model_name = "nlptown/bert-base-multilingual-uncased-sentiment"
        sent_tokenizer = AutoTokenizer.from_pretrained(model_name)
        sent_model = AutoModelForSequenceClassification.from_pretrained(model_name)
        sent_model.eval()
        sentiment_model = sent_model  # Set alias
        logger.info("Sentiment model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to load sentiment model: {e}")
        return False


def load_embedding_model():
    """Load sentence transformer for embeddings"""
    global embedder, embedding_model
    try:
        embedder = SentenceTransformer("all-MiniLM-L6-v2")
        embedding_model = embedder  # Set alias
        logger.info("Embedding model loaded successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to load embedding model: {e}")
        return False


def load_edge_cases(file_path: str = "edge_cases.txt"):
    """Load edge case examples for RAG-style retrieval"""
    global edge_case_chunks, edge_case_embeddings
    try:
        if not os.path.exists(file_path):
            logger.warning(f"Edge cases file not found: {file_path}")
            return
        
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = [ln.strip() for ln in f if ln.strip()]
        
        # Chunk into groups of 5 lines
        edge_case_chunks = ["\n".join(lines[i:i+5]) for i in range(0, len(lines), 5)]
        
        if embedder and edge_case_chunks:
            edge_case_embeddings = embedder.encode(edge_case_chunks)
            logger.info(f"Loaded {len(edge_case_chunks)} edge case chunks")
    except Exception as e:
        logger.error(f"Failed to load edge cases: {e}")


# ------------- Core Analysis Functions ------------- #

def map_star_to_sentiment(star_idx: int) -> str:
    """Map nlptown 1-5 star rating to 3-class sentiment"""
    mapping = {0: "Negative", 1: "Negative", 2: "Neutral", 3: "Positive", 4: "Positive"}
    return mapping.get(star_idx, "Neutral")


def analyze_sentiment(text: str, language: str) -> str:
    """Analyze sentiment using multilingual model with fallback"""
    if sent_tokenizer and sent_model and text.strip():
        try:
            inputs = sent_tokenizer(
                text, 
                return_tensors='pt', 
                truncation=True, 
                padding=True, 
                max_length=256
            )
            with torch.no_grad():
                outputs = sent_model(**inputs)
            star_idx = int(torch.argmax(outputs.logits, dim=1).item())
            return map_star_to_sentiment(star_idx)
        except Exception as e:
            logger.warning(f"Sentiment model failed, using fallback: {e}")
    
    # Heuristic fallback
    t = text.lower()
    pos_words = ["good", "great", "excellent", "love", "helpful", "fast", "improve", "support"]
    neg_words = ["bad", "slow", "error", "issue", "problem", "worst", "hate", "concern"]
    
    pos_count = sum(1 for w in pos_words if w in t)
    neg_count = sum(1 for w in neg_words if w in t)
    
    if pos_count > neg_count:
        return "Positive"
    elif neg_count > pos_count:
        return "Negative"
    return "Neutral"


def detect_nuance(text: str, language: str) -> List[str]:
    """Detect nuanced communication patterns (sarcasm, mixed sentiment, etc.)"""
    nuances = []
    tl = text.lower()
    
    # Sarcasm detection
    sarcasm_en = [
        "yeah right", "sure", "as if", "great, another", "just what we needed",
        "oh wonderful", "obviously", "thanks a lot", "what a relief"
    ]
    sarcasm_hi = ["बिल्कुल सही", "वाह", "बहुत बढ़िया", "क्या बात है", "मज़ाक", "क्या फायदा"]
    
    target_list = sarcasm_hi if language == "Hindi" else sarcasm_en
    check_text = text if language == "Hindi" else tl
    
    if any(k in check_text for k in target_list):
        nuances.append("Sarcasm")
    
    # Mixed sentiment
    if ("but" in tl and ("good" in tl or "improve" in tl)) or \
       ("लेकिन" in text and "अच्छा" in text):
        nuances.append("Mixed Sentiment")
    
    # Polite disagreement
    if any(p in tl for p in ["respectfully", "with due respect", "may not", "might not"]) or \
       any(p in text for p in ["सादर", "आदरपूर्वक"]):
        nuances.append("Polite Disagreement")
    
    # Short/ambiguous
    if len(text.strip().split()) < 5:
        nuances.append("Short/Ambiguous")
    
    return nuances


def detect_language(text: str) -> str:
    """Simple language detection (Devanagari -> Hindi, else English)"""
    for ch in text:
        if '\u0900' <= ch <= '\u097F':
            return "Hindi"
    return "English"


def detect_spam(text: str) -> bool:
    """Detect spam/low-quality feedback"""
    t = text.lower()
    
    # Too short
    if len(t) < 3:
        return True
    
    # Spam patterns
    spam_patterns = ["http://", "https://", "buy now", "free $$$", "click here", "www."]
    if any(p in t for p in spam_patterns):
        return True
    
    # Repeated character spam (e.g., "aaaaaaa")
    if any(ch * 6 in t for ch in set(t)):
        return True
    
    # Excessive uppercase
    if len(text) > 10:
        upper_ratio = sum(1 for c in text if c.isupper()) / len(text)
        if upper_ratio > 0.7:
            return True
    
    return False


def compute_predictive_scores(text: str) -> Dict[str, int]:
    """Compute predictive risk/impact scores based on keywords"""
    tl = text.lower()
    
    def score(keywords: List[str]) -> int:
        count = sum(tl.count(kw) for kw in keywords)
        return min(100, count * 20)
    
    return {
        "legal_risk": score([
            "non-compliance", "penalty", "violate", "risk", "litigation",
            "lawsuit", "legal", "regulation", "fine"
        ]),
        "compliance_diff": score([
            "complex", "difficult", "burden", "cost", "ambiguous",
            "unclear", "confusing", "challenging"
        ]),
        "business_growth": score([
            "growth", "innovation", "revenue", "invest", "expand",
            "opportunity", "competitive", "market"
        ])
    }


def detect_edge_case_flags(text: str) -> List[str]:
    """Detect additional edge case patterns"""
    tl = text.lower()
    flags = []
    
    # Potential sarcasm
    if any(w in tl for w in ["great", "wonderful", "amazing"]) and \
       any(w in tl for w in ["another", "again", "more"]):
        flags.append("Potential sarcasm")
    
    # Mixed sentiment indicators
    if 'but' in tl or 'however' in tl:
        flags.append("Mixed sentiment")
    
    # Polite disagreement
    if any(p in tl for p in ["with respect", "due respect", "may not", "might not"]):
        flags.append("Polite disagreement")
    
    # Very short
    if len(text.split()) <= 3:
        flags.append("Short / ambiguous")
    
    return flags


def retrieve_similar_edge_case(text: str, top_k: int = 1) -> Optional[str]:
    """Retrieve similar edge case using RAG-style semantic search"""
    if embedder is None or not edge_case_chunks or edge_case_embeddings is None:
        return None
    
    try:
        q_emb = embedder.encode([text])[0]
        similarities = []
        
        for chunk, emb in zip(edge_case_chunks, edge_case_embeddings):
            sim = float(np.dot(q_emb, emb) / (np.linalg.norm(q_emb) * np.linalg.norm(emb) + 1e-9))
            similarities.append((chunk, sim))
        
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top match if similarity is significant
        if similarities and similarities[0][1] > 0.5:
            return similarities[0][0]
        
        return None
    except Exception as e:
        logger.error(f"Edge case retrieval failed: {e}")
        return None


# ------------- Groq AI Integration ------------- #

async def groq_chat(
    messages: List[Dict[str, str]], 
    max_tokens: int = 300,
    groq_api_key: Optional[str] = None
) -> Tuple[Optional[str], Optional[str]]:
    """Call Groq AI API with model fallback"""
    key = groq_api_key or os.getenv("GROQ_API_KEY")
    
    if not key or key == "YOUR_LOCAL_GROQ_KEY":
        return None, "No valid Groq API key"
    
    last_error = None
    
    async with httpx.AsyncClient(timeout=45.0) as client:
        for model in GROQ_MODEL_CANDIDATES:
            try:
                response = await client.post(
                    GROQ_URL,
                    headers={
                        "Authorization": f"Bearer {key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": model,
                        "messages": messages,
                        "max_tokens": max_tokens
                    }
                )
                
                if response.status_code == 200:
                    data = response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content")
                    if content:
                        return content.strip(), model
                else:
                    txt = response.text.lower()
                    if "decommissioned" in txt or response.status_code in (400, 410):
                        last_error = f"Model {model} unavailable ({response.status_code})"
                        continue
                    last_error = f"HTTP {response.status_code}: {response.text[:120]}"
            except Exception as e:
                last_error = str(e)
                logger.error(f"Groq API call failed for model {model}: {e}")
    
    return None, last_error


def generate_simple_summary(text: str) -> str:
    """Generate a simple heuristic summary of feedback text"""
    txt = text.strip()
    if len(txt) < 40:
        return txt
    
    sentences = [s.strip() for s in re.split(r'[.!?]+', txt) if len(s.strip()) > 10]
    if not sentences:
        return txt[:120] + ('...' if len(txt) > 120 else '')
    
    # Prioritize sentences with key terms
    key_words = ["should", "must", "concern", "recommend", "support", "oppose", "suggest", "propose"]
    for s in sentences[:3]:
        if any(k in s.lower() for k in key_words):
            return (s[:160] + '...') if len(s) > 160 else s
    
    # Return first sentence
    best = sentences[0]
    return (best[:160] + '...') if len(best) > 160 else best


async def summarize_feedback_with_ai(
    feedback_texts: List[str],
    groq_api_key: Optional[str] = None
) -> str:
    """Generate AI summary of feedback using Groq"""
    if not feedback_texts:
        return "No feedback to summarize."
    
    # Heuristic fallback
    def heuristic_summary() -> str:
        from collections import Counter
        total = len(feedback_texts)
        # Simple word frequency
        top_terms = Counter()
        for text in feedback_texts[-60:]:
            for word in text.lower().split():
                w2 = ''.join(ch for ch in word if ch.isalpha())
                if len(w2) > 5 and w2 not in {"stakeholder", "should", "comment", "therefore"}:
                    top_terms[w2] += 1
        common = ", ".join(w for w, _ in top_terms.most_common(6)) or "N/A"
        return f"Heuristic Summary: {total} comments analyzed. Frequent terms: {common}."
    
    # Try AI summary
    key = groq_api_key or os.getenv("GROQ_API_KEY")
    if not key or key == "YOUR_LOCAL_GROQ_KEY":
        return heuristic_summary()
    
    # Prepare context (last 60 comments, truncated)
    MAX_COMMENTS = 60
    trimmed = []
    for text in feedback_texts[-MAX_COMMENTS:]:
        txt = text.strip().replace('\n', ' ')
        if len(txt) > 280:
            txt = txt[:277] + '...'
        trimmed.append(f"- {txt}")
    
    content = "\n".join(trimmed)
    prompt = (
        "You are an expert policy analyst. Summarize recurring thematic clusters (bullet list), "
        "approximate sentiment distribution (percentages), and provide exactly three concise "
        "actionable recommendations prefixed with 'RECOMMENDATION:'. Use neutral tone.\n" + content
    )
    
    messages = [{"role": "user", "content": prompt}]
    result, error = await groq_chat(messages, max_tokens=420, groq_api_key=key)
    
    if result:
        return result
    
    return heuristic_summary() + (f" (AI fallback: {error})" if error else "")


# ------------- Clustering & Analytics ------------- #

def perform_clustering(
    texts: List[str],
    n_clusters: int = 3
) -> Tuple[Optional[Dict[int, List[int]]], Optional[float]]:
    """Perform KMeans clustering on feedback embeddings"""
    if not embedder or not texts:
        return None, None
    
    try:
        embeddings = embedder.encode(texts, show_progress_bar=False)
        
        k = min(max(2, n_clusters), len(embeddings))
        
        # Check for sufficient diversity
        unique_embeddings = np.unique(embeddings, axis=0)
        if len(unique_embeddings) < 2:
            logger.warning("Not enough diversity in embeddings for clustering")
            return None, None
        
        model = KMeans(n_clusters=k, random_state=42, n_init='auto')
        labels = model.fit_predict(embeddings)
        
        # Group indices by cluster
        clusters = {}
        for idx, label in enumerate(labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(idx)
        
        # Compute silhouette score if viable
        silhouette = None
        if len(set(labels)) > 1 and len(labels) <= 2000:
            try:
                silhouette = float(silhouette_score(embeddings, labels))
            except Exception as e:
                logger.warning(f"Silhouette score computation failed: {e}")
        
        return clusters, silhouette
    except Exception as e:
        logger.error(f"Clustering failed: {e}")
        return None, None


def generate_wordcloud_image(texts: List[str]) -> Optional[BytesIO]:
    """Generate word cloud image from feedback texts (English only)"""
    if not texts:
        return None
    
    # Filter to English texts only
    english_texts = []
    for text in texts:
        lang = detect_language(text)
        if lang != "Hindi":
            english_texts.append(text)
    
    if not english_texts:
        return None
    
    combined_text = " ".join(english_texts)
    
    try:
        wc = WordCloud(width=900, height=400, background_color="white").generate(combined_text)
        
        # Save to BytesIO
        img_buffer = BytesIO()
        wc.to_image().save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        return img_buffer
    except Exception as e:
        logger.error(f"Word cloud generation failed: {e}")
        return None


def analyze_concern_patterns(feedback_texts: List[str]) -> Dict[str, Dict[str, Any]]:
    """Analyze historical concern patterns in feedback"""
    counts = Counter()
    
    for text in feedback_texts:
        tl = text.lower()
        for category, keywords in HISTORICAL_CONCERN_PATTERNS.items():
            if any(kw in tl for kw in keywords):
                counts[category] += 1
    
    total = len(feedback_texts) or 1
    
    return {
        cat: {
            "count": cnt,
            "percent": round(100 * cnt / total, 1)
        }
        for cat, cnt in counts.items()
    }
