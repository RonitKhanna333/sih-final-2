# Client-Side Policy Context Feature - Complete Guide

## Overview
The client-side dashboard now includes full policy context integration, allowing users to:
1. **View the active policy** they're commenting on
2. **Submit feedback** that's automatically linked to the policy
3. **AI analysis** uses both the comment AND policy context for better insights

## 🎯 Key Features

### 1. **Policy Display for Users**
- Beautiful policy context card at the top of client dashboard
- Shows policy title, description, status, category
- "Read Full Policy" button to expand and read complete text
- Encourages informed participation

### 2. **Automatic Policy Linking**
- Every feedback submission includes `policyId`
- Backend stores the relationship between feedback and policy
- AI can reference specific policy when analyzing sentiment

### 3. **Enhanced AI Analysis**
When users submit feedback:
- ✅ Sentiment analysis knows what policy they're discussing
- ✅ Predictive scoring considers policy context
- ✅ Legal references can be policy-specific
- ✅ Better clustering by policy topic

### 4. **User Experience**
- Visual confirmation that feedback is linked to policy
- Success message after submission
- View all submissions with analysis results
- Clear call-to-action messaging

## 📁 Files Modified

### Frontend (1 file)
✅ `frontend/app/client/dashboard/page.tsx` - Complete client dashboard with:
  - Policy context display
  - Feedback submission with policyId
  - Success/error messaging
  - Visual indicators for policy linking

### Components Used
✅ `frontend/components/PolicyContext.tsx` - Reusable policy display
✅ `frontend/lib/api.ts` - Policy API client methods

## 🚀 How It Works

### User Flow:
```
1. User visits /client/dashboard
   ↓
2. System loads active policy from backend
   ↓
3. Policy context card displays at top
   ↓
4. User reads policy (can expand full text)
   ↓
5. User submits feedback in form
   ↓
6. Frontend includes policyId in submission
   ↓
7. Backend saves feedback with policy link
   ↓
8. AI analyzes with policy context
   ↓
9. User sees results in "My Submissions"
```

### Backend Flow:
```
POST /api/v1/feedback/
{
  "text": "User's opinion...",
  "language": "English",
  "stakeholderType": "Business Owner",
  "policyId": "uuid-of-active-policy"  // AUTO-INCLUDED
}
↓
Backend stores with policy reference
↓
AI features can query:
- All feedback for specific policy
- Policy text for context
- Combined analysis
```

## 💻 Code Examples

### Client Dashboard Usage

**Fetching Active Policy:**
```typescript
const { data: activePolicy } = useQuery<Policy>({
  queryKey: ['activePolicy'],
  queryFn: () => policyAPI.getActive(),
  refetchInterval: 60000, // Refresh every minute
});
```

**Submitting Feedback with Policy Context:**
```typescript
submitMutation.mutate({
  text: "My feedback...",
  language: "English",
  stakeholderType: "Corporate",
  policyId: activePolicy?.id // AUTOMATICALLY LINKED
});
```

**Displaying Policy to User:**
```tsx
{activePolicy && (
  <PolicyContext policy={activePolicy} />
)}
```

### Backend Usage (AI Features)

**Query feedback for specific policy:**
```python
# Get all feedback for a policy
feedback = await prisma.feedback.find_many(
    where={"policyId": policy_id}
)

# Get policy context for AI
policy = await prisma.policy.find_unique(
    where={"id": policy_id}
)

# AI can now analyze with full context
ai_analysis = analyze_with_context(
    feedback_text=feedback.text,
    policy_context=policy.fullText
)
```

## 🎨 UI Features

### Policy Context Card
- **Blue gradient** header (matches admin dashboard)
- **Status badges**: Green "ACTIVE", Blue category
- **Metadata**: Version, comment count, last updated
- **Expandable text**: Full policy in scrollable container
- **Call-to-action**: Encourages participation

### Feedback Form
- **Dynamic placeholder**: Shows policy title
- **Visual indicator**: Green checkmark with "linked to policy" message
- **Success notification**: Confirms submission with explanation
- **Real-time validation**: Disabled until text is entered

### My Submissions
- **Color-coded sentiment**: Green/Red/Yellow badges
- **Analysis results**: Nuances, spam detection
- **Timestamps**: When feedback was submitted
- **Legal references**: If AI found relevant precedents

## 🔧 Configuration

### Environment Variables
No additional configuration needed! Uses existing:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Policy Management
Admins can:
1. Create policies via `/api/v1/policy/create`
2. Set status to "active" for public consultation
3. View feedback count per policy
4. Archive old policies when consultation ends

## 📊 Data Flow

### Database Schema
```prisma
model Policy {
  id          String     @id @default(uuid())
  title       String
  fullText    String     @db.Text
  status      String     // "active" = visible to users
  feedbacks   Feedback[] // All comments on this policy
}

model Feedback {
  id        String   @id
  text      String
  sentiment String
  policyId  String?  // Links to policy
  policy    Policy?  @relation(fields: [policyId], references: [id])
}
```

### API Response Example
```json
{
  "id": "uuid",
  "title": "Companies Act Amendment - CSR",
  "description": "Increase CSR spending to 3%...",
  "fullText": "# Proposed Amendment\n\n## Background...",
  "status": "active",
  "category": "Corporate Law",
  "version": "1.0",
  "feedbackCount": 147,
  "createdAt": "2025-10-04T...",
  "updatedAt": "2025-10-04T..."
}
```

## 🎯 Benefits

### For Users:
- ✅ **See what they're commenting on** (full policy text)
- ✅ **Informed participation** (read before commenting)
- ✅ **Transparency** (know their feedback is linked)
- ✅ **Better results** (AI understands context)

### For Administrators:
- ✅ **Organized feedback** (grouped by policy)
- ✅ **Better analytics** (policy-specific insights)
- ✅ **Track engagement** (feedback count per policy)
- ✅ **Historical data** (compare policies over time)

### For AI Analysis:
- ✅ **Contextual understanding** (knows what users discuss)
- ✅ **Accurate sentiment** (policy-aware analysis)
- ✅ **Better clustering** (group by policy topics)
- ✅ **Targeted predictions** (policy-specific impacts)

## 🚀 Usage Examples

### User Story 1: Submitting Feedback
```
1. User logs in to /client/dashboard
2. Sees: "Proposed Amendment to Companies Act, 2013 - Section 135 (CSR)"
3. Clicks "Read Full Policy" to review details
4. Types opinion: "Increasing to 3% will burden small companies..."
5. Submits → Backend automatically links to policy
6. AI analyzes with policy context
7. Results show sentiment + policy-aware insights
```

### User Story 2: Viewing Results
```
1. User checks "My Submissions" section
2. Sees their previous comment
3. Analysis shows:
   - Sentiment: Negative (based on "burden" language)
   - Nuances: ["concern", "economic_impact"]
   - AI understood they're discussing CSR spending specifically
4. Legal reference: Related compliance cases shown
```

### Admin Story: Policy-Specific Analytics
```python
# Admin runs query for policy insights
policy_id = "uuid-of-csr-policy"

# Get all feedback for this policy
feedback = await prisma.feedback.find_many(
    where={"policyId": policy_id}
)

# Calculate policy-specific metrics
sentiment_distribution = {
    "Positive": sum(1 for f in feedback if f.sentiment == "Positive"),
    "Negative": sum(1 for f in feedback if f.sentiment == "Negative"),
    "Neutral": sum(1 for f in feedback if f.sentiment == "Neutral")
}

# Generate policy-specific insights
concerns = extract_concerns(feedback, policy.fullText)
```

## 🔮 Advanced Use Cases

### 1. Policy Section Comments
Future: Users can comment on specific sections
```typescript
{
  text: "This will hurt SMEs",
  policyId: "uuid",
  policySection: "Section 1.2 - CSR Spending" // NEW
}
```

### 2. Policy Comparison
Future: Compare sentiment across policy versions
```typescript
const v1Feedback = await getFeedbackByPolicy(policyV1Id);
const v2Feedback = await getFeedbackByPolicy(policyV2Id);
const comparison = compareSentiment(v1Feedback, v2Feedback);
```

### 3. AI Recommendations
AI can suggest policy changes based on feedback:
```python
def suggest_amendments(policy: Policy, feedback: List[Feedback]):
    concerns = extract_top_concerns(feedback)
    return generate_suggestions(policy.fullText, concerns)
```

## ✅ Testing

### Manual Test Steps:
1. **Start backend**: `cd backend; python main.py`
2. **Start frontend**: `cd frontend; npm run dev`
3. **Visit client dashboard**: http://localhost:3001/client/dashboard
4. **Expected**:
   - Policy card appears at top
   - "Proposed Amendment to Companies Act..." title
   - Green "ACTIVE" badge
   - "Read Full Policy" button works
5. **Submit feedback**:
   - Enter text
   - Click Submit
   - Success message appears
   - Check "My Submissions" for results
6. **Verify in backend**:
   ```bash
   cd backend
   python check_policy.py  # Shows feedback count increased
   ```

### Database Verification:
```python
# Check feedback has policyId
feedback = await prisma.feedback.find_first(
    where={"text": {"contains": "your test text"}}
)
assert feedback.policyId is not None
print(f"Linked to policy: {feedback.policyId}")
```

## 📞 Troubleshooting

**Problem**: "No active policy found" error
- **Solution**: Run `cd backend; python check_policy.py` to create policy

**Problem**: Policy not showing on client dashboard
- **Solution**: Check backend logs, ensure status is "active"
- **Command**: `python -c "import asyncio; from prisma import Prisma; async def check(): p = Prisma(); await p.connect(); pol = await p.policy.find_first(where={'status': 'active'}); print(pol); await p.disconnect(); asyncio.run(check())"`

**Problem**: Feedback not linked to policy
- **Solution**: Check frontend console for API errors
- **Verify**: `policyId` is included in POST request payload

## 🎉 Summary

**What's New:**
- ✅ Client dashboard shows active policy context
- ✅ All feedback automatically linked to policy
- ✅ AI analysis uses policy context for better insights
- ✅ Users see what they're commenting on
- ✅ Better organization and analytics

**Impact:**
- **Users**: More informed, better participation
- **Admins**: Better analytics, organized feedback
- **AI**: Contextual understanding, accurate analysis

**Files Changed**: 1 frontend file
**Backend Changes**: Already integrated from previous work
**Breaking Changes**: None (backward compatible)

---

**Status**: ✅ **COMPLETE AND READY TO USE**
**Date**: October 2025
**Feature**: Client-side policy context with AI integration
