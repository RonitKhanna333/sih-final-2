# 🌱 Sample Data Seeding Guide

## Overview

The `seed_data.py` script adds **50+ realistic sample feedback comments** to your database for testing the USP features.

---

## 📊 Sample Data Includes

### Policy Areas Covered (30+ topics):
- ✅ Digital India 2.0 initiatives
- ✅ Data privacy regulations (48h breach notification)
- ✅ Healthcare reforms (Ayushman Bharat expansion)
- ✅ Agricultural policies (MSP, subsidies)
- ✅ Environmental policies (EV adoption)
- ✅ Education reforms (NEP 2020)
- ✅ Taxation and GST reforms
- ✅ Urban development (Smart Cities)
- ✅ Women's safety and empowerment
- ✅ Labor reforms and gig economy
- ✅ Renewable energy and climate
- ✅ Cryptocurrency and fintech regulation
- ✅ Tourism and cultural heritage
- ✅ Space technology privatization
- ✅ Food security and PDS
- ✅ Manufacturing (Make in India, PLI)
- ✅ Water resources (Jal Jeevan Mission)
- ✅ And 13+ more diverse areas!

### Stakeholder Perspectives:
- **Citizens** (general public, youth, parents)
- **Farmers** (small farmers, FPOs)
- **Technology Companies** (startups, large corporations)
- **Government Officials** (ministers, bureaucrats)
- **Opposition Parties** (political critics)
- **NGOs and Civil Society** (activists, advocacy groups)
- **Industry Associations** (manufacturing, telecom, etc.)
- **Legal Experts** (lawyers, compliance professionals)
- **Privacy Advocates** (digital rights groups)
- **Healthcare Professionals** (doctors, hospitals)
- **Educational Institutions** (schools, universities)
- **Labor Unions** (workers' representatives)
- **Gig Workers** (delivery partners, drivers)
- **And 20+ more stakeholder types!

### Sentiment Distribution:
- **Positive**: ~30% (supportive, enthusiastic feedback)
- **Neutral**: ~30% (mixed feelings, conditional support)
- **Negative**: ~40% (concerns, opposition, criticism)

### Language Coverage:
- **English**: 80% of feedback
- **Hindi**: 20% of feedback (देवनागरी script)

### Time Range:
- Feedback distributed over **last 30 days**
- Varied timestamps for realistic testing

---

## 🚀 How to Run

### Method 1: Direct Execution
```powershell
cd backend
python seed_data.py
```

### Method 2: With Virtual Environment
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python seed_data.py
```

---

## 📝 What the Script Does

1. **Connects to database** (uses DATABASE_URL from .env)
2. **Checks existing data** (asks before adding if >50 entries exist)
3. **Adds 50+ feedback entries** with:
   - Realistic policy-related text
   - Appropriate sentiment labels
   - Stakeholder type and sector tags
   - Summary for each entry
   - Varied timestamps (last 30 days)
   - Nuances (emotional tone)
   - Risk scores (legal, compliance, business)
4. **Shows progress** (real-time feedback on each entry)
5. **Displays statistics** (total count, sentiment breakdown)

---

## 🎯 Why You Need This Data

### For Testing USP Features:

#### 1. Policy Sandbox (Predictive Impact Simulation)
- **Needs:** 50+ relevant feedback items
- **Sample data provides:** Feedback on data privacy, Digital India, healthcare, etc.
- **Test scenario:** Change "72 hours" to "48 hours" breach notification
- **Expected result:** Tech companies show negative shift, privacy advocates positive

#### 2. Debate Map (Consensus & Conflict Visualization)
- **Needs:** 10+ feedback items (50+ for good clustering)
- **Sample data provides:** Diverse opinions across 30+ topics
- **Expected result:** 
  - 5-8 distinct clusters identified
  - Conflict zones: Tech vs Privacy Advocates, Farmers vs Government
  - Consensus: Need for digital literacy, infrastructure improvement

#### 3. AI Documents (Automated Report Generation)
- **Needs:** 10+ relevant feedback on a topic
- **Sample data provides:** Multiple entries per policy area
- **Test scenarios:**
  - Briefing on "Digital India 2.0"
  - Public Response to "Agricultural Subsidies"
  - Risk Assessment on "Data Privacy Regulations"

---

## 📋 Sample Entry Structure

Each feedback entry includes:

```json
{
  "text": "Full feedback text (1-3 sentences)",
  "sentiment": "Positive/Neutral/Negative",
  "language": "en/hi",
  "stakeholderType": "Technology Companies",
  "sector": "Technology",
  "nuances": ["supportive", "enthusiastic"],
  "summary": "Brief 1-line summary",
  "legalRiskScore": 0.1-0.5,
  "complianceDifficultyScore": 0.2-0.6,
  "businessGrowthScore": 0.3-0.8,
  "createdAt": "2025-09-XX to 2025-10-04"
}
```

---

## 🔍 Verification

After running the script, verify data was added:

### Option 1: Check via API
```bash
# Get feedback count
curl http://localhost:8000/api/v1/analytics/kpis \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected output includes:
# "totalSubmissions": 50+
# "sentimentBreakdown": { Positive: X, Neutral: Y, Negative: Z }
```

### Option 2: Check via Frontend
1. Login as admin at `http://localhost:3000/login`
2. Go to `/admin/dashboard-new`
3. Check Overview tab - should show 50+ submissions
4. Check Feedback Management tab - should list all entries

### Option 3: Check via Prisma Studio
```bash
cd backend
npx prisma studio
```
Navigate to `Feedback` model and see all entries

---

## 🎨 Sample Data Highlights

### Most Controversial Topic: Data Privacy (48h notification)
- **Tech Companies:** "48 hours too stringent, need 72 hours"
- **Privacy Advocates:** "48 hours too long, want 24 hours"
- **Legal Experts:** "Balanced and forward-thinking policy"
→ Perfect for testing conflict detection in Debate Map

### Most Supported Topic: Healthcare Expansion
- **Citizens:** "Life-changing policy for senior citizens"
- **Rural Citizens:** "Need hospitals before insurance"
- **Opposition:** "Fiscally unsustainable"
→ Good for testing sentiment distribution

### Most Divided Topic: Labor Reforms
- **Labor Unions:** "Anti-worker, removes job security"
- **Gig Workers:** "Need social security benefits"
- **Industry:** "Necessary for global competitiveness"
→ Excellent for testing stakeholder prediction

---

## 🐛 Troubleshooting

### Issue: "Module 'prisma' not found"
**Solution:** Ensure Prisma client is generated
```bash
cd backend
npx prisma generate
```

### Issue: "Connection refused"
**Solution:** Check DATABASE_URL in .env
```bash
# Should look like:
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

### Issue: "Database already has X entries"
**Response:** Script will ask for confirmation before adding more
- Type `y` to add sample data anyway
- Type `n` to cancel

### Issue: "Some entries skipped"
**Reason:** Possible duplicate text or database constraints
**Impact:** Minor - you'll still have 45-50 entries added

---

## 🔄 Re-running the Script

You can run the script multiple times:
- It will add new entries each time
- Timestamps will be varied
- Script asks for confirmation if >50 entries exist

**To clear database and start fresh:**
```bash
cd backend
npx prisma migrate reset
# Then run seed script
python seed_data.py
```

---

## 📊 Expected Output

```
================================================================================
🌱 Sample Feedback Data Seeding Script
================================================================================

This will add 50+ sample feedback entries covering:
  - Digital India 2.0 initiatives
  - Data privacy regulations
  ...

✅ Connected to database
📊 Existing feedback entries: 0

✅ [1/50] Added: Strong support for Digital India 2.0 and rural 5G rollout...
✅ [2/50] Added: Support for Digital India 2.0 creating rural employment...
...
✅ [50/50] Added: Sports bodies see improved performance from infrastructure...

================================================================================
🎉 Seeding Complete!
✅ Successfully added: 50 feedback entries
⚠️  Skipped: 0 entries

📊 Database Statistics:
   Total Feedback: 50
   Sentiment Breakdown:
      - Positive: 15 entries
      - Neutral: 15 entries
      - Negative: 20 entries

🚀 Your database is now ready for testing USP features!

Recommended next steps:
1. Start backend: cd backend && python main.py
2. Start frontend: cd frontend && npm run dev
3. Login as admin and test all three USP features
```

---

## 🎯 Testing Workflow After Seeding

1. **Start Backend:**
   ```bash
   cd backend
   python main.py
   ```
   Verify: http://localhost:8000/docs shows API endpoints

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   Verify: http://localhost:3000 loads

3. **Login as Admin:**
   - Email: admin@example.com
   - Password: admin123
   (Or use your configured admin credentials)

4. **Test Policy Sandbox:**
   - Go to "Policy Sandbox" tab
   - Use default example (72h → 48h)
   - Click "Run Impact Simulation"
   - Verify: Shows stakeholder predictions

5. **Test Debate Map:**
   - Go to "Debate Map" tab
   - Wait 15-30 seconds for generation
   - Verify: Interactive plot with clusters

6. **Test AI Documents:**
   - Go to "AI Documents" tab
   - Select "Briefing"
   - Topic: "Digital India"
   - Click "Generate AI Document"
   - Verify: Multi-section document appears

---

## 🏆 Success Criteria

Your database is ready when:
- ✅ 50+ feedback entries added
- ✅ Sentiment breakdown shows variety (not all one type)
- ✅ Multiple stakeholder types represented
- ✅ Timestamps spread over 30 days
- ✅ Both English and Hindi entries present
- ✅ Policy Sandbox shows predictions (not errors)
- ✅ Debate Map generates clusters (not "insufficient data")
- ✅ AI Documents create reports (not "no relevant feedback")

---

**Ready to test your next-generation policy-making platform!** 🚀

For more information, see:
- `USP_FEATURES_GUIDE.md` - Complete feature documentation
- `USP_QUICK_REFERENCE.md` - Quick testing guide
- `IMPLEMENTATION_COMPLETE.md` - Technical details
