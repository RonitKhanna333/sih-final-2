"""Advanced AI Features API - Predictive Simulation, Debate Mapping, Document Generation

Features:
* Async Groq adapter returning safe strings (with mock mode)
* Graceful degraded outputs for simulation (never 404 due to sparse data)
* Debate map fallbacks (UMAP→PCA, HDBSCAN→KMeans, minimal mode when <10 items)
* Document generation accepting documentType or reportType alias
* AI health endpoint with capability diagnostics & optional warmup
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import logging, os, asyncio
from datetime import datetime
import numpy as np

from utils.database import prisma, get_all_feedback, get_prisma
from utils.analysis import embedding_model

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["ai-features"])

# ---------------------------------------------------------------------------
# AI HEALTH / STATE
# ---------------------------------------------------------------------------
_ai_state: Dict[str, Any] = {
    "llm_available": False,
    "llm_model": None,
    "llm_last_error": None,
    "warmup_complete": False,
    "feedback_count_cache": {"value": None, "ts": None},
    "policy_count_cache": {"value": None, "ts": None},
}
MOCK_MODE = bool(int(os.getenv("AI_MOCK_MODE", "0") or "0"))

def _cache_is_fresh(ts: Optional[datetime], ttl_seconds: int) -> bool:
    return bool(ts and (datetime.now() - ts).total_seconds() < ttl_seconds)

def _require_prisma():
    try:
        return get_prisma()
    except Exception:
        return None

# Ensure we return ASCII/English-friendly text; if not possible, use fallback
def _ascii_or_fallback(text: str, fallback: str, max_len: int = 60) -> str:
    try:
        ascii_txt = (text or "").encode('ascii', 'ignore').decode().strip()
    except Exception:
        ascii_txt = ""
    if not ascii_txt:
        return fallback
    return ascii_txt[:max_len]

async def _count_feedback_and_policies() -> Dict[str, int]:
    now = datetime.now()
    if _cache_is_fresh(_ai_state['feedback_count_cache']['ts'], 60) and _cache_is_fresh(_ai_state['policy_count_cache']['ts'], 60):
        return {
            'feedback': _ai_state['feedback_count_cache']['value'] or 0,
            'policies': _ai_state['policy_count_cache']['value'] or 0
        }
    client = _require_prisma()
    if client:
        try:
            fb_count = await client.feedback.count()
        except Exception:
            fb_count = 0
        try:
            policy_count = await client.policy.count()
        except Exception:
            policy_count = 0
    else:
        fb_count = 0
        policy_count = 0
    _ai_state['feedback_count_cache'] = {"value": fb_count, "ts": now}
    _ai_state['policy_count_cache'] = {"value": policy_count, "ts": now}
    return {'feedback': fb_count, 'policies': policy_count}

class AIHealthResponse(BaseModel):
    status: str
    llmAvailable: bool
    llmModel: Optional[str]
    embeddingModelLoaded: bool
    feedbackCount: int
    policyCount: int
    canSimulate: bool
    canDebateMapFull: bool
    debateMapMode: str
    documentGenerationReady: bool
    degradedReasons: List[str]
    mockMode: bool
    timestamp: datetime
    class Config:
        arbitrary_types_allowed = True

async def _llm_warmup():
    if _ai_state.get('warmup_complete') or MOCK_MODE:
        return
    try:
        result = await _llm_complete("Return READY", max_tokens=5)
        if 'ready' in result.lower():
            _ai_state['llm_available'] = True
            _ai_state['llm_model'] = _ai_state.get('llm_model') or 'auto'
        else:
            _ai_state['llm_last_error'] = 'Warmup mismatch'
    except Exception as e:
        _ai_state['llm_last_error'] = str(e)
    finally:
        _ai_state['warmup_complete'] = True

def schedule_llm_warmup():
    """Public helper invoked from main lifespan to schedule warmup."""
    try:
        loop = asyncio.get_event_loop()
        loop.create_task(_llm_warmup())
    except RuntimeError:
        pass

@router.get("/health", response_model=AIHealthResponse)
async def ai_health():
    counts = await _count_feedback_and_policies()
    degraded: List[str] = []
    emb_loaded = embedding_model is not None
    llm_avail = _ai_state['llm_available'] or MOCK_MODE
    if not emb_loaded:
        degraded.append('embedding_model_not_loaded')
    if not llm_avail:
        degraded.append('llm_unavailable')
    feedback_count = counts['feedback']
    policies = counts['policies']
    can_sim = emb_loaded and feedback_count >= 3
    full_map = emb_loaded and feedback_count >= 10
    debate_mode = 'full' if full_map else ('minimal' if feedback_count > 0 else 'unavailable')
    if debate_mode != 'full':
        degraded.append('debate_map_minimal')
    status = 'ready-mock' if MOCK_MODE else ('ready' if not degraded else ('degraded' if feedback_count > 0 else 'offline'))
    return AIHealthResponse(
        status=status,
        llmAvailable=llm_avail,
        llmModel=_ai_state.get('llm_model'),
        embeddingModelLoaded=emb_loaded,
        feedbackCount=feedback_count,
        policyCount=policies,
        canSimulate=can_sim,
        canDebateMapFull=full_map,
        debateMapMode=debate_mode,
        documentGenerationReady=llm_avail,
        degradedReasons=degraded,
        mockMode=MOCK_MODE,
        timestamp=datetime.utcnow()
    )

# ---------------------------------------------------------------------------
# LLM ADAPTER
# ---------------------------------------------------------------------------
async def _llm_complete(prompt: str, max_tokens: int = 300) -> str:
    if MOCK_MODE:
        return f"[MOCK RESPONSE] {prompt[:60]}..."
    try:
        from utils.analysis import groq_chat
        messages = [{"role": "user", "content": prompt}]
        result, meta = await groq_chat(messages, max_tokens=max_tokens)
        if result:
            _ai_state['llm_available'] = True
            if meta:
                _ai_state['llm_model'] = meta
            return result.strip()
        _ai_state['llm_last_error'] = meta or 'unknown'
        return f"LLM unavailable ({meta})" if meta else "LLM unavailable"
    except Exception as e:
        _ai_state['llm_last_error'] = str(e)
        logger.error(f"LLM call failed: {e}")
        return "LLM error"

# ---------------------------------------------------------------------------
# MODELS
# ---------------------------------------------------------------------------
class PolicySimulationRequest(BaseModel):
    originalText: str
    modifiedText: str
    stakeholderContext: Optional[List[str]] = None

class SimulationImpact(BaseModel):
    stakeholderType: str
    currentSentiment: str
    predictedSentiment: str
    sentimentShiftPercentage: int
    keyDrivers: List[str]
    riskLevel: str

class PolicySimulationResponse(BaseModel):
    summary: str
    identifiedChange: str
    overallRiskAssessment: str
    stakeholderImpacts: List[SimulationImpact]
    emergingConcerns: List[str]
    consensusImpact: str
    recommendations: List[str]
    confidence: float

class DebateMapCluster(BaseModel):
    id: int
    label: str
    size: int
    averageSentiment: str
    keyThemes: List[str]
    color: str

class DebateMapPoint(BaseModel):
    id: str
    x: float
    y: float
    clusterId: int
    text: str
    sentiment: str
    stakeholderType: Optional[str]

class DebateMapResponse(BaseModel):
    points: List[DebateMapPoint]
    clusters: List[DebateMapCluster]
    narrative: str
    conflictZones: List[Dict[str, Any]]
    consensusAreas: List[str]

class DocumentGenerationRequest(BaseModel):
    documentType: Optional[str] = None
    reportType: Optional[str] = None
    topic: str
    dateRange: Optional[Dict[str, str]] = None
    stakeholderFilter: Optional[List[str]] = None
    sentimentFilter: Optional[str] = None
    def effective_type(self) -> str:
        return (self.documentType or self.reportType or "briefing").strip()

class DocumentSection(BaseModel):
    heading: str
    content: str
    citations: Optional[List[str]] = None

class DocumentGenerationResponse(BaseModel):
    documentType: str
    title: str
    executiveSummary: str
    sections: List[DocumentSection]
    metadata: Dict[str, Any]
    generatedAt: datetime

# Chat assistant models
class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    maxHistory: int = 8
    includeContext: bool = True
    sentimentFocus: Optional[str] = None  # e.g., 'Positive' | 'Negative' | 'Neutral'

class ChatResponse(BaseModel):
    reply: str
    usedContext: int
    model: Optional[str] = None
    degraded: bool = False

# ---------------------------------------------------------------------------
# FEATURE 1: IMPACT SIMULATION
# ---------------------------------------------------------------------------
async def identify_semantic_change(original: str, modified: str) -> str:
    prompt = f"""You are a policy analyst. Compare these two versions of a policy clause and identify the key substantive change in 1-2 sentences.\n\nORIGINAL:\n{original}\n\nMODIFIED:\n{modified}\n\nKey change:"""
    return await _llm_complete(prompt, max_tokens=150)

async def retrieve_relevant_opinions(change_description: str, limit: int = 50) -> List[Dict]:
    feedback = await get_all_feedback(limit=500)
    if not feedback or not embedding_model:
        return []
    change_emb = embedding_model.encode([change_description])[0]
    scored = []
    for fb in feedback:
        try:
            emb = embedding_model.encode([fb['text']])[0]
            sim = float(np.dot(change_emb, emb) / (np.linalg.norm(change_emb) * np.linalg.norm(emb)))
            scored.append({**fb, 'relevance_score': sim})
        except Exception:
            continue
    scored.sort(key=lambda x: x['relevance_score'], reverse=True)
    return scored[:limit]

async def predict_stakeholder_impacts(change: str, relevant: List[Dict]) -> List[SimulationImpact]:
    from collections import defaultdict
    groups = defaultdict(list)
    for fb in relevant:
        groups[fb.get('stakeholderType', 'General Public')].append(fb)
    impacts: List[SimulationImpact] = []
    for stype, items in groups.items():
        sentiments = [i['sentiment'] for i in items]
        current = max(set(sentiments), key=sentiments.count)
        sample = [i['text'][:160] for i in items[:5]]
        prompt = ("Predict impact for stakeholder group.\n" +
                  f"CHANGE: {change}\nGROUP: {stype}\nCURRENT: {current}\nSAMPLE:\n" +
                  "\n".join('- ' + s for s in sample) +
                  "\nReturn lines: PREDICTED_SENTIMENT:, SHIFT_PERCENTAGE:, KEY_DRIVERS:, RISK_LEVEL:")
        resp = await _llm_complete(prompt, max_tokens=220)
        predicted, shift, drivers, risk = 'Neutral', 0, [], 'medium'
        for line in resp.split('\n'):
            if 'PREDICTED_SENTIMENT:' in line:
                predicted = line.split(':',1)[1].strip()
            elif 'SHIFT_PERCENTAGE:' in line:
                digits = ''.join(c for c in line if c.isdigit())
                shift = int(digits) if digits else 15
            elif 'KEY_DRIVERS:' in line:
                drivers = [d.strip() for d in line.split(':',1)[1].split(',')][:3]
            elif 'RISK_LEVEL:' in line:
                risk = line.split(':',1)[1].strip().lower()
        impacts.append(SimulationImpact(
            stakeholderType=stype,
            currentSentiment=current,
            predictedSentiment=predicted,
            sentimentShiftPercentage=shift,
            keyDrivers=drivers,
            riskLevel=risk
        ))
    return impacts

@router.post("/policy/simulate", response_model=PolicySimulationResponse)
async def simulate_policy_impact(request: PolicySimulationRequest):
    try:
        change = await identify_semantic_change(request.originalText, request.modifiedText)
        relevant = await retrieve_relevant_opinions(change, limit=50)
        if not relevant:
            return PolicySimulationResponse(
                summary="Insufficient historical data to model stakeholder impacts.",
                identifiedChange=change,
                overallRiskAssessment="UNKNOWN",
                stakeholderImpacts=[],
                emergingConcerns=[],
                consensusImpact="Unknown",
                recommendations=[
                    "Gather more feedback", "Engage key stakeholder groups", "Re-run after data expansion"
                ],
                confidence=0.2
            )
        impacts = await predict_stakeholder_impacts(change, relevant)
        high_risk = sum(1 for i in impacts if i.riskLevel == 'high')
        avg_shift = np.mean([i.sentimentShiftPercentage for i in impacts]) if impacts else 0
        summary_prompt = f"Provide a concise 2-sentence executive summary of predicted impacts. Change: {change}."
        summary = await _llm_complete(summary_prompt, max_tokens=140)
        recs_prompt = "Provide 3 numbered actionable recommendations based on stakeholder impacts."\
                       f" Impacts: {'; '.join(i.stakeholderType+':'+i.predictedSentiment for i in impacts)}"
        rec_text = await _llm_complete(recs_prompt, max_tokens=160)
        recommendations = [ln.strip()[3:] for ln in rec_text.split('\n') if ln.strip() and ln.strip()[0].isdigit()][:3]
        if high_risk >= 2 or avg_shift > 40:
            overall = "HIGH - Significant opposition likely"
        elif high_risk == 1 or avg_shift > 25:
            overall = "MEDIUM - Moderate concerns"
        else:
            overall = "LOW - Broadly acceptable"
        all_drivers: List[str] = []
        for imp in impacts: all_drivers.extend(imp.keyDrivers)
        emerging = list(dict.fromkeys(all_drivers))[:5]
        negatives = sum(1 for i in impacts if i.predictedSentiment.lower() == 'negative')
        consensus = "May fracture consensus" if negatives > len(impacts)/2 else "Consensus likely maintained"
        confidence = min(0.95, 0.5 + (len(relevant) / 100))
        return PolicySimulationResponse(
            summary=summary,
            identifiedChange=change,
            overallRiskAssessment=overall,
            stakeholderImpacts=impacts,
            emergingConcerns=emerging,
            consensusImpact=consensus,
            recommendations=recommendations,
            confidence=confidence
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Simulation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Simulation failed: {e}")

# ---------------------------------------------------------------------------
# FEATURE 2: DEBATE MAP
# ---------------------------------------------------------------------------
_debate_map_cache: Dict[str, Any] = {"data": None, "timestamp": None}

@router.get("/analytics/debate-map", response_model=DebateMapResponse)
async def generate_debate_map(regenerate: bool = False):
    try:
        if not regenerate and _debate_map_cache['data'] and _debate_map_cache['timestamp']:
            age = (datetime.now() - _debate_map_cache['timestamp']).seconds
            if age < 3600:
                return _debate_map_cache['data']
        feedback = await get_all_feedback(limit=2000)
        def minimal_response(reason: str) -> DebateMapResponse:
            points = [DebateMapPoint(
                id=f['id'], x=float(i), y=0.0, clusterId=0,
                text=f['text'][:120], sentiment=f['sentiment'], stakeholderType=f.get('stakeholderType')
            ) for i, f in enumerate(feedback)]
            cluster = DebateMapCluster(id=0, label="General Feedback", size=len(points),
                                      averageSentiment="Neutral", keyThemes=[reason], color="#6b7280")
            return DebateMapResponse(points=points, clusters=[cluster],
                                     narrative="Not enough data or model unavailable; showing minimal view.",
                                     conflictZones=[], consensusAreas=[cluster.label])

        if len(feedback) < 10:
            return minimal_response("Insufficient Data")

        texts = [f['text'] for f in feedback]
        coords = None

        if embedding_model:
            embeddings = embedding_model.encode(texts, show_progress_bar=False)
            # Dimensionality reduction
            try:
                import umap  # type: ignore
                reducer = umap.UMAP(n_components=2, n_neighbors=15, min_dist=0.1, metric='cosine', random_state=42)
                coords = reducer.fit_transform(embeddings)
            except Exception as e:
                logger.warning(f"UMAP failed, using PCA: {e}")
                from sklearn.decomposition import PCA  # type: ignore
                coords = PCA(n_components=2, random_state=42).fit_transform(embeddings)
        else:
            # Fallback: Build lightweight text embeddings via TF-IDF and project to 2D.
            # This avoids a flat line minimal map when transformer embeddings are unavailable.
            try:
                from sklearn.feature_extraction.text import TfidfVectorizer  # type: ignore
                from sklearn.decomposition import TruncatedSVD  # type: ignore
                vec = TfidfVectorizer(max_features=1000, stop_words='english')
                X = vec.fit_transform(texts)
                svd = TruncatedSVD(n_components=2, random_state=42)
                coords = svd.fit_transform(X)
                logger.info("Debate map using TF-IDF+SVD fallback (embedding model unavailable)")
            except Exception as e:
                logger.warning(f"TF-IDF fallback failed; returning minimal map: {e}")
                return minimal_response("Embedding Model Unavailable")
        # Clustering
        try:
            import hdbscan  # type: ignore
            clusterer = hdbscan.HDBSCAN(min_cluster_size=max(5, len(feedback)//20), min_samples=3)
            labels = clusterer.fit_predict(coords)
        except Exception as e:
            logger.warning(f"HDBSCAN failed, using KMeans: {e}")
            from sklearn.cluster import KMeans  # type: ignore
            kmeans = KMeans(n_clusters=min(5, max(2, len(feedback)//10)), random_state=42)
            labels = kmeans.fit_predict(coords)
        points: List[DebateMapPoint] = []
        for i, fb in enumerate(feedback):
            points.append(DebateMapPoint(
                id=fb['id'], x=float(coords[i][0]), y=float(coords[i][1]), clusterId=int(labels[i]),
                text=fb['text'][:200], sentiment=fb['sentiment'], stakeholderType=fb.get('stakeholderType')
            ))
        unique = set(labels); unique.discard(-1)
        clusters: List[DebateMapCluster] = []
        palette = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
        for cid in sorted(unique):
            cluster_items = [fb for idx, fb in enumerate(feedback) if labels[idx] == cid]
            if not cluster_items:
                continue
            sentiments = [fb['sentiment'] for fb in cluster_items]
            avg_sent = max(set(sentiments), key=sentiments.count)
            sample = [fb['text'][:150] for fb in cluster_items[:5]]
            label_prompt = (
                "Provide a SHORT (3-5 words) theme label for this feedback set. "
                "Respond in ENGLISH only using ASCII characters. Do not add quotes or punctuation beyond spaces.\n"
                + "\n".join('- ' + s for s in sample)
            )
            raw_label = (await _llm_complete(label_prompt, max_tokens=40)).split('\n')[0]
            label = _ascii_or_fallback(raw_label, fallback=f"Group {cid+1}", max_len=40)
            if (not label) or (len(label) < 3) or ('llm' in label.lower()) or ('mock' in label.lower()):
                label = f"Group {cid+1}"
            key_themes = list({fb.get('stakeholderType','General') for fb in cluster_items if fb.get('stakeholderType')})[:3]
            clusters.append(DebateMapCluster(
                id=int(cid), label=label or f"Group {cid+1}", size=len(cluster_items),
                averageSentiment=avg_sent, keyThemes=key_themes if key_themes else ["General"],
                color=palette[cid % len(palette)]
            ))
        narrative_prompt = (
            f"Two sentence narrative of the debate with {len(clusters)} groups and {len(feedback)} items. "
            f"Write in ENGLISH only. Groups: {'; '.join(c.label for c in clusters)}"
        )
        narrative_raw = await _llm_complete(narrative_prompt, max_tokens=110)
        narrative = _ascii_or_fallback(narrative_raw, fallback="Debate landscape summary (English) unavailable.", max_len=500)
        conflict: List[Dict[str, Any]] = []
        for i, c1 in enumerate(clusters):
            for c2 in clusters[i+1:]:
                if c1.averageSentiment != c2.averageSentiment:
                    conflict.append({
                        'cluster1': c1.label,
                        'cluster2': c2.label,
                        'description': f'Conflicting views between {c1.label} and {c2.label}'
                    })
        positive = [c for c in clusters if c.averageSentiment == 'Positive']
        response = DebateMapResponse(
            points=points,
            clusters=clusters,
            narrative=narrative,
            conflictZones=conflict[:3],
            consensusAreas=[c.label for c in positive]
        )
        _debate_map_cache['data'] = response
        _debate_map_cache['timestamp'] = datetime.now()
        return response
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Debate map generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate debate map: {e}")

# ---------------------------------------------------------------------------
# FEATURE 3: DOCUMENT GENERATION
# ---------------------------------------------------------------------------
@router.post("/documents/generate", response_model=DocumentGenerationResponse)
async def generate_policy_document(request: DocumentGenerationRequest):
    try:
        client = _require_prisma()
        if client is None:
            raise HTTPException(status_code=503, detail="Database not initialized (prisma client missing)")
        doc_type = request.effective_type()
        where: Dict[str, Any] = {}
        if request.sentimentFilter:
            where['sentiment'] = request.sentimentFilter
        if request.dateRange:
            date_filter: Dict[str, Any] = {}
            if request.dateRange.get('start'):
                date_filter['gte'] = datetime.fromisoformat(request.dateRange['start'])
            if request.dateRange.get('end'):
                date_filter['lte'] = datetime.fromisoformat(request.dateRange['end'])
            if date_filter:
                where['createdAt'] = date_filter
        feedback_items = await client.feedback.find_many(where=where, take=200, order={"createdAt": "desc"})
        if not feedback_items:
            raise HTTPException(status_code=404, detail="No feedback found matching filters")
        if embedding_model:
            topic_emb = embedding_model.encode([request.topic])[0]
            scored: List[Dict[str, Any]] = []
            for fb in feedback_items:
                emb = embedding_model.encode([fb.text])[0]
                sim = float(np.dot(topic_emb, emb) / (np.linalg.norm(topic_emb) * np.linalg.norm(emb)))
                if sim > 0.3:
                    scored.append({'id': fb.id, 'text': fb.text, 'sentiment': fb.sentiment,
                                   'stakeholderType': fb.stakeholderType, 'relevance': sim})
            scored.sort(key=lambda x: x['relevance'], reverse=True)
            relevant = scored[:50]
        else:
            relevant = [{'id': fb.id, 'text': fb.text, 'sentiment': fb.sentiment,
                         'stakeholderType': fb.stakeholderType} for fb in feedback_items[:50]]
        if not relevant:
            raise HTTPException(status_code=404, detail=f"No relevant feedback found for topic: {request.topic}")
        feedback_summary = '\n'.join([
            f"- [{fb['sentiment']}] {fb.get('stakeholderType','General')}: {fb['text'][:150]}" for fb in relevant[:20]
        ])
        sections: List[DocumentSection] = []
        if doc_type == 'briefing':
            title = f"Policy Briefing: {request.topic}"
            exec_summary = await _llm_complete(f"3 sentence executive summary for briefing on {request.topic} with {len(relevant)} feedback items.", max_tokens=160)
            positions = await _llm_complete(f"3 supporting and 3 opposing arguments (bullets) for {request.topic}:\n{feedback_summary}", max_tokens=260)
            sections.append(DocumentSection(heading="Stakeholder Positions", content=positions, citations=[fb['id'] for fb in relevant[:10]]))
            concerns = await _llm_complete(f"Top 5 numbered concerns about {request.topic}:\n{feedback_summary}", max_tokens=220)
            sections.append(DocumentSection(heading="Key Concerns Raised", content=concerns))
            recs = await _llm_complete(f"4 numbered actionable recommendations for {request.topic} addressing concerns.", max_tokens=220)
            sections.append(DocumentSection(heading="Recommendations", content=recs))
        elif doc_type == 'response':
            title = f"Public Response: {request.topic}"
            exec_summary = f"Draft response addressing {len(relevant)} public comments on {request.topic}."
            ack = await _llm_complete(f"Opening acknowledgment paragraph for public response on {request.topic}.", max_tokens=120)
            sections.append(DocumentSection(heading="Acknowledgment", content=ack))
            themes = await _llm_complete(f"Key themes (3-4 short paragraphs) for public response about {request.topic}:\n{feedback_summary}", max_tokens=360)
            sections.append(DocumentSection(heading="Key Themes", content=themes))
            resp = await _llm_complete(f"Paragraph on government response strategy for {request.topic} concerns.", max_tokens=180)
            sections.append(DocumentSection(heading="Our Response", content=resp))
        elif doc_type == 'risk_assessment':
            title = f"Risk Assessment: {request.topic}"
            exec_summary = f"Risk assessment based on {len(relevant)} stakeholder inputs regarding {request.topic}."
            political = await _llm_complete(f"Political risks (3-4) with severity for {request.topic}:\n{feedback_summary}", max_tokens=260)
            sections.append(DocumentSection(heading="Political Risk Analysis", content=political))
            operational = await _llm_complete(f"Operational implementation risks (3-4) & mitigation for {request.topic}:\n{feedback_summary}", max_tokens=260)
            sections.append(DocumentSection(heading="Operational Risk Analysis", content=operational))
            reputational = await _llm_complete(f"Reputational risks (3-4) & communication strategies for {request.topic}:\n{feedback_summary}", max_tokens=260)
            sections.append(DocumentSection(heading="Reputational Risk Analysis", content=reputational))
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported document/report type: {doc_type}")
        sentiment_counts = {
            'positive': sum(1 for fb in relevant if fb['sentiment'] == 'Positive'),
            'negative': sum(1 for fb in relevant if fb['sentiment'] == 'Negative'),
            'neutral': sum(1 for fb in relevant if fb['sentiment'] == 'Neutral')
        }
        stakeholder_types = list({fb.get('stakeholderType','General') for fb in relevant if fb.get('stakeholderType')})
        metadata = {
            'totalFeedbackAnalyzed': len(relevant),
            'sentimentDistribution': sentiment_counts,
            'stakeholderTypes': stakeholder_types,
            'dateRange': request.dateRange,
            'filters': {
                'sentiment': request.sentimentFilter,
                'stakeholders': request.stakeholderFilter
            }
        }
        generated_at = datetime.now()
        metadata['dateGenerated'] = generated_at.isoformat()
        return DocumentGenerationResponse(
            documentType=doc_type,
            title=title,
            executiveSummary=exec_summary,
            sections=sections,
            metadata=metadata,
            generatedAt=generated_at
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Document generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate document: {e}")

# ---------------------------------------------------------------------------
# FEATURE 4: ASSISTANT CHAT
# ---------------------------------------------------------------------------
@router.post("/assistant/chat", response_model=ChatResponse)
async def assistant_chat(request: ChatRequest):
    """Lightweight chat assistant grounded in recent feedback.

    Strategy:
    * Take last N user/assistant messages (N=maxHistory) for conversation continuity.
    * Optionally retrieve up to 30 recent feedback items (filtered by sentiment if provided).
    * Construct a system-style preamble instructing the model to act as a policy feedback analysis assistant.
    * If LLM unavailable (degraded), return heuristic summary-based fallback.
    """
    try:
        history = request.messages[-request.maxHistory:]
        user_messages = [m.content for m in history if m.role == 'user']
        latest_question = user_messages[-1] if user_messages else ''
        used_context = 0

        # Gather contextual feedback
        context_snippets: List[str] = []
        if request.includeContext:
            fb = await get_all_feedback(limit=120)
            if request.sentimentFocus:
                fb = [f for f in fb if f.get('sentiment') == request.sentimentFocus]
            # Simple sampling prioritizing recent entries
            for item in fb[:30]:
                txt = item['text'].replace('\n', ' ')[:220]
                context_snippets.append(f"[{item.get('sentiment','?')}] {txt}")
            used_context = len(context_snippets)

        # If no LLM (mock/offline), create heuristic reply
        if not (_ai_state.get('llm_available') or MOCK_MODE):
            if not context_snippets:
                return ChatResponse(reply="AI currently warming up. Please try again shortly.", usedContext=0, degraded=True)
            # Very simple heuristic extraction
            sentiments = {'Positive':0,'Negative':0,'Neutral':0}
            for snip in context_snippets:
                if '[Positive]' in snip: sentiments['Positive']+=1
                elif '[Negative]' in snip: sentiments['Negative']+=1
                elif '[Neutral]' in snip: sentiments['Neutral']+=1
            dist = ', '.join(f"{k}:{v}" for k,v in sentiments.items())
            reply = (
                "(Heuristic Mode) Based on sampled feedback: " + dist + ". "
                + (f"Your question: '{latest_question}'. " if latest_question else "")
                + "Ask again once the full model is ready for deeper thematic insights."
            )
            return ChatResponse(reply=reply, usedContext=used_context, degraded=True)

        # Build prompt for LLM
        preamble = (
            "You are an expert policy consultation analysis assistant. "
            "Provide concise, actionable insights grounded in the supplied public feedback context. "
            "If recommending actions, use bullet points. Keep tone professional and neutral."
        )
        context_block = "\n".join('- ' + c for c in context_snippets)
        convo_block = "\n".join(f"{m.role.upper()}: {m.content}" for m in history)
        prompt = (
            f"{preamble}\n\nRECENT FEEDBACK CONTEXT (sample of {used_context}):\n{context_block}\n\n"
            f"CONVERSATION HISTORY:\n{convo_block}\n\nASSISTANT: Provide the best possible answer to the last user message."
        )
        reply = await _llm_complete(prompt, max_tokens=380)
        return ChatResponse(reply=reply, usedContext=used_context, model=_ai_state.get('llm_model'), degraded=False)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Assistant chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {e}")

__all__ = [
    'ai_health', 'simulate_policy_impact', 'generate_debate_map', 'generate_policy_document',
    'assistant_chat', 'schedule_llm_warmup'
]

# ---------------------------------------------------------------------------
# AI HEALTH STATE & MOCK MODE
# ---------------------------------------------------------------------------
_ai_state: Dict[str, Any] = {
    "llm_available": False,
    "llm_model": None,
    "llm_last_error": None,
    "warmup_complete": False,
    "feedback_count_cache": {"value": None, "ts": None},
    "policy_count_cache": {"value": None, "ts": None},
}

MOCK_MODE = bool(int(__import__('os').getenv('AI_MOCK_MODE', '0') or '0'))

def _cache_is_fresh(ts: Optional[datetime], ttl_seconds: int) -> bool:
    if not ts:
        return False
    return (datetime.now() - ts).total_seconds() < ttl_seconds

async def _count_feedback_and_policies() -> Dict[str, int]:
    # Cache counts for 60 seconds to avoid DB hammering
    now = datetime.now()
    if _cache_is_fresh(_ai_state['feedback_count_cache']['ts'], 60) and \
       _cache_is_fresh(_ai_state['policy_count_cache']['ts'], 60):
        return {
            'feedback': _ai_state['feedback_count_cache']['value'] or 0,
            'policies': _ai_state['policy_count_cache']['value'] or 0
        }
    try:
        fb_count = await prisma.feedback.count()
    except Exception:
        fb_count = 0
    try:
        policy_count = await prisma.policy.count()
    except Exception:
        policy_count = 0
    _ai_state['feedback_count_cache'] = {"value": fb_count, "ts": now}
    _ai_state['policy_count_cache'] = {"value": policy_count, "ts": now}
    return {'feedback': fb_count, 'policies': policy_count}

    class Config:
        arbitrary_types_allowed = True

    @router.get("/health", response_model=AIHealthResponse)
    async def ai_health():
        counts = await _count_feedback_and_policies()
        degraded: List[str] = []
        emb_loaded = embedding_model is not None
        llm_avail = _ai_state['llm_available'] or MOCK_MODE
        if not emb_loaded:
            degraded.append('embedding_model_not_loaded')
        if not llm_avail:
            degraded.append('llm_unavailable')
        feedback_count = counts['feedback']
        policies = counts['policies']
        can_sim = emb_loaded and feedback_count >= 3
        full_map = emb_loaded and feedback_count >= 10
        debate_mode = 'full' if full_map else ('minimal' if feedback_count > 0 else 'unavailable')
        if debate_mode != 'full':
            degraded.append('debate_map_minimal')
        status = 'ready-mock' if MOCK_MODE else ('ready' if not degraded else ('degraded' if feedback_count > 0 else 'offline'))
        return AIHealthResponse(
            status=status,
            llmAvailable=llm_avail,
            llmModel=_ai_state.get('llm_model'),
            embeddingModelLoaded=emb_loaded,
            feedbackCount=feedback_count,
            policyCount=policies,
            canSimulate=can_sim,
            canDebateMapFull=full_map,
            debateMapMode=debate_mode,
            documentGenerationReady=llm_avail,
            degradedReasons=degraded,
            mockMode=MOCK_MODE,
            timestamp=datetime.utcnow()
        )

    # ---------------------------------------------------------------------------
    # LLM ADAPTER
    # ---------------------------------------------------------------------------
    async def _llm_complete(prompt: str, max_tokens: int = 300) -> str:
        if MOCK_MODE:
            return f"[MOCK RESPONSE] {prompt[:60]}..."
        try:
            from utils.analysis import groq_chat
            messages = [{"role": "user", "content": prompt}]
            result, meta = await groq_chat(messages, max_tokens=max_tokens)
            if result:
                _ai_state['llm_available'] = True
                if meta:
                    _ai_state['llm_model'] = meta
                return result.strip()
            _ai_state['llm_last_error'] = meta or 'unknown'
            return f"LLM unavailable ({meta})" if meta else "LLM unavailable"
        except Exception as e:
            _ai_state['llm_last_error'] = str(e)
            logger.error(f"LLM call failed: {e}")
            return "LLM error"

    # ---------------------------------------------------------------------------
    # MODELS
    # ---------------------------------------------------------------------------
    class PolicySimulationRequest(BaseModel):
        originalText: str
        modifiedText: str
        stakeholderContext: Optional[List[str]] = None

    class SimulationImpact(BaseModel):
        stakeholderType: str
        currentSentiment: str
        predictedSentiment: str
        sentimentShiftPercentage: int
        keyDrivers: List[str]
        riskLevel: str

    class PolicySimulationResponse(BaseModel):
        summary: str
        identifiedChange: str
        overallRiskAssessment: str
        stakeholderImpacts: List[SimulationImpact]
        emergingConcerns: List[str]
        consensusImpact: str
        recommendations: List[str]
        confidence: float

    class DebateMapCluster(BaseModel):
        id: int
        label: str
        size: int
        averageSentiment: str
        keyThemes: List[str]
        color: str

    class DebateMapPoint(BaseModel):
        id: str
        x: float
        y: float
        clusterId: int
        text: str
        sentiment: str
        stakeholderType: Optional[str]

    class DebateMapResponse(BaseModel):
        points: List[DebateMapPoint]
        clusters: List[DebateMapCluster]
        narrative: str
        conflictZones: List[Dict[str, Any]]
        consensusAreas: List[str]

    class DocumentGenerationRequest(BaseModel):
        documentType: Optional[str] = None
        reportType: Optional[str] = None
        topic: str
        dateRange: Optional[Dict[str, str]] = None
        stakeholderFilter: Optional[List[str]] = None
        sentimentFilter: Optional[str] = None
        def effective_type(self) -> str:
            return (self.documentType or self.reportType or "briefing").strip()

    class DocumentSection(BaseModel):
        heading: str
        content: str
        citations: Optional[List[str]] = None

    class DocumentGenerationResponse(BaseModel):
        documentType: str
        title: str
        executiveSummary: str
        sections: List[DocumentSection]
        metadata: Dict[str, Any]
        generatedAt: datetime

    # ---------------------------------------------------------------------------
    # FEATURE 1: IMPACT SIMULATION
    # ---------------------------------------------------------------------------
    async def identify_semantic_change(original: str, modified: str) -> str:
        prompt = f"""You are a policy analyst. Compare these two versions of a policy clause and identify the key substantive change in 1-2 sentences.\n\nORIGINAL:\n{original}\n\nMODIFIED:\n{modified}\n\nKey change:"""
        return await _llm_complete(prompt, max_tokens=150)

    async def retrieve_relevant_opinions(change_description: str, limit: int = 50) -> List[Dict]:
        feedback = await get_all_feedback(limit=500)
        if not feedback or not embedding_model:
            return []
        change_emb = embedding_model.encode([change_description])[0]
        scored = []
        for fb in feedback:
            try:
                emb = embedding_model.encode([fb['text']])[0]
                sim = float(np.dot(change_emb, emb) / (np.linalg.norm(change_emb) * np.linalg.norm(emb)))
                scored.append({**fb, 'relevance_score': sim})
            except Exception:
                continue
        scored.sort(key=lambda x: x['relevance_score'], reverse=True)
        return scored[:limit]

