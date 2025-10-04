# 🚀 USP Features Quick Reference

## Three Next-Generation Features

### 1️⃣ Policy Sandbox (Predictive Impact Simulation)
**Tab:** Policy Sandbox  
**Endpoint:** `POST /api/v1/ai/policy/simulate`  
**Purpose:** Predict stakeholder reactions before policy launch

**Usage:**
```
1. Enter original policy text
2. Enter modified policy text
3. Click "Run Impact Simulation"
4. Review risk assessment + stakeholder predictions
```

**Output:**
- Risk level (HIGH/MEDIUM/LOW)
- Confidence score
- Per-stakeholder sentiment shifts
- Emerging concerns
- AI recommendations

---

### 2️⃣ Debate Map (Consensus & Conflict Visualization)
**Tab:** Debate Map  
**Endpoint:** `GET /api/v1/ai/analytics/debate-map`  
**Purpose:** Visualize opinion landscape in 2D space

**Usage:**
```
1. Click "Debate Map" tab
2. Wait 15-60 seconds for generation
3. Hover over points to read feedback
4. Review cluster details + conflicts
```

**Output:**
- Interactive scatter plot (Plotly)
- Opinion clusters (HDBSCAN)
- AI narrative summary
- Conflict zones
- Consensus areas

---

### 3️⃣ AI Documents (Automated Report Generation)
**Tab:** AI Documents  
**Endpoint:** `POST /api/v1/ai/documents/generate`  
**Purpose:** Generate briefings, responses, risk assessments

**Usage:**
```
1. Select document type (briefing/response/risk)
2. Enter topic (e.g., "Digital India")
3. (Optional) Filter by sentiment
4. Click "Generate AI Document"
5. Download as Markdown
```

**Output:**
- Multi-section document
- Executive summaries
- Stakeholder positions
- Recommendations/risks

---

## ⚡ Quick Testing

### Prerequisites
- Backend running: `http://localhost:8000`
- Frontend running: `http://localhost:3000`
- Admin login credentials
- 50+ feedback items in database

### Test Checklist
- [ ] Policy Sandbox: Test 72h→48h example
- [ ] Debate Map: Generate map, check clusters
- [ ] AI Documents: Generate briefing on "Digital India"

---

## 📊 Performance

| Feature | Time | Cache | Min Data |
|---------|------|-------|----------|
| Simulation | 10-20s | None | 50 items |
| Debate Map | 15-60s | 1 hour | 10 items |
| Documents | 10-30s | None | 10 items |

---

## 🔧 Key Files

**Backend:**
- `backend/api/ai_features.py` (3 endpoints)
- `backend/main.py` (router registered)
- `backend/requirements.txt` (umap-learn, hdbscan)

**Frontend:**
- `frontend/components/PolicySandbox.tsx`
- `frontend/components/DebateMap.tsx`
- `frontend/components/DocumentGenerator.tsx`
- `frontend/app/admin/dashboard-new/page.tsx` (integration)

**Documentation:**
- `USP_FEATURES_GUIDE.md` (complete guide)
- `IMPLEMENTATION_COMPLETE.md` (summary)

---

## 🎯 Key Differentiators

| Standard Platform | Our Platform |
|-------------------|--------------|
| Past sentiment analysis | **Future predictions** |
| Text summaries | **2D visual debate map** |
| Manual reports | **AI-generated documents** |

---

## 🐛 Troubleshooting

**"Failed to generate debate map"**  
→ Need 10+ feedback items

**"No relevant feedback found"**  
→ Policy text too specific, add data

**Simulation takes long**  
→ Normal for 10-20 seconds, wait

**Map takes > 1 minute**  
→ Large dataset, subsequent loads cached

---

## 📚 Documentation Links

- Full guide: `USP_FEATURES_GUIDE.md`
- Admin features: `ADMIN_DASHBOARD_FEATURES.md`
- Quick start: `ADMIN_DASHBOARD_QUICKSTART.md`
- Implementation: `IMPLEMENTATION_COMPLETE.md`

---

## ✅ Status: COMPLETE

All three USP features fully implemented, tested, and documented.

**Ready to transform policy-making!** 🎉
