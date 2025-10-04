# AI Feature Degraded & Fallback Behaviors

This document explains how the backend AI feature endpoints behave under limited data, missing models, or unavailable LLM provider.

## Overview
The system is designed to **fail soft**. Instead of returning 5xx/4xx for common transient or capacity issues, it returns deterministic, explainable reduced outputs so the frontend can still render useful UI states.

| Feature | Normal Mode | Degraded / Minimal Trigger | Degraded Behavior |
|---------|-------------|----------------------------|-------------------|
| Policy Simulation (`POST /api/v1/ai/policy/simulate`) | Uses semantic change detection + vector relevance + stakeholder impact prediction | Fewer than 3 relevant feedback items OR embeddings unavailable | Returns summary stating insufficient data, empty impacts, low confidence (0.2), actionable generic recommendations |
| Debate Map (`GET /api/v1/ai/analytics/debate-map`) | UMAP (or PCA fallback) + HDBSCAN (or KMeans fallback) clustering with LLM-generated cluster labels & narrative | < 10 feedback items | Returns a single cluster "General Feedback" with linear x positions, neutral sentiment, explanatory narrative |
| Document Generation (`POST /api/v1/ai/documents/generate`) | Relevance filtering via embeddings + structured multi-section AI synthesis | No feedback after filtering OR no relevant items above threshold | Returns 404 (intentional: indicates user must adjust filters or add data) |
| LLM Usage (all features) | Calls Groq model sequence until success | No API key, provider error, or mock mode enabled | Returns placeholder strings like `LLM unavailable (...)` or `[MOCK RESPONSE] ...` without breaking schema |

## Health Endpoint
`GET /api/v1/ai/health` provides capability diagnostics:
```json
{
  "status": "ready | degraded | ready-mock | offline",
  "llmAvailable": true,
  "embeddingModelLoaded": true,
  "feedbackCount": 42,
  "policyCount": 3,
  "canSimulate": true,
  "canDebateMapFull": false,
  "debateMapMode": "minimal",
  "documentGenerationReady": true,
  "degradedReasons": ["debate_map_minimal"],
  "mockMode": false,
  "timestamp": "2025-10-04T12:34:56Z"
}
```

### Status Meanings
- `ready`: All major capabilities available (LLM + embeddings + data thresholds)
- `degraded`: Core still usable, but one or more fallbacks active
- `ready-mock`: Running with `AI_MOCK_MODE=1` (non-production deterministic stub)
- `offline`: No feedback and critical capabilities missing (e.g., embeddings & LLM)

## Mock Mode
Set environment variable:
```
AI_MOCK_MODE=1
```
All LLM responses become deterministic: `[MOCK RESPONSE] <prompt head>...`.
Use this for local testing without a Groq key.

## Debate Map Fallback Chain
1. Embeddings required – if missing: 503 (hard fail to signal ops issue)
2. Reduction: UMAP → PCA fallback on error
3. Clustering: HDBSCAN → KMeans fallback on error
4. Minimal Mode: If feedback count < 10, skip embeddings/clustering and return single synthetic cluster

## Simulation Confidence Scaling
Confidence = `min(0.95, 0.5 + relevant_feedback_count / 100)`; minimal mode forces 0.2.

## Frontend Recommendations
- Pre-fetch `/api/v1/ai/health` before rendering heavy visualizations
- Show banners for `debateMapMode !== 'full'`
- Hide or disable deep-dive clustering UI when `debateMapMode === 'minimal'`
- Use `mockMode` to display a non-production badge

## Error vs Degraded Distinction
| Scenario | Response Code | Rationale |
|----------|---------------|-----------|
| Missing embeddings during debate map | 503 | Operational dependency failure (alert needed) |
| Too little data for simulation | 200 (degraded payload) | User action (add data) not backend fault |
| No feedback after user filter in documents | 404 | User-provided filter excludes everything |
| LLM provider/network failure | 200 with placeholder content | Preserve UX continuity |

## Adding New Fallbacks
1. Keep schemas stable (never remove required fields)
2. Populate with sentinel values (`[]`, `{}`, "UNKNOWN", low confidence numbers)
3. Add a new reason string into `degradedReasons`
4. Update this doc

## Quick Test Checklist
| Test | Expected |
|------|----------|
| No Groq key + simulate | Returns summary + confidence 0.2 if sparse |
| <10 feedback + debate map | Single cluster minimal response |
| Risk assessment doc with data | Multiple sections populated |
| Mock mode on | All LLM fields start with `[MOCK RESPONSE]` |
| Health when minimal map | `debateMapMode: minimal` + reason present |

---
Maintainers: Update this file when altering fallback thresholds or adding new AI endpoints.
