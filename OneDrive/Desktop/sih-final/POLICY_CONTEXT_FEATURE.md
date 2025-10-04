# Policy Context Feature - Setup Guide

## Overview
Added comprehensive policy context feature to the eConsultation platform. Users can now see the policy they're commenting on, and all feedback is linked to specific policies for better AI analysis.

## Changes Made

### 1. Database Schema Updates
**File:** `backend/db/schema.prisma`

Added new Policy model:
```prisma
model Policy {
  id          String     @id @default(uuid())
  title       String
  description String
  fullText    String     @db.Text
  version     String     @default("1.0")
  status      String     @default("draft") // draft, active, archived
  category    String?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  feedbacks   Feedback[]
}
```

Updated Feedback model to include policy reference:
- Added `policyId` field
- Added `policy` relation

### 2. Backend API
**New File:** `backend/api/policy.py`

Created comprehensive Policy API with endpoints:
- `GET /api/v1/policy/list` - List all policies with filters
- `GET /api/v1/policy/{id}` - Get specific policy
- `GET /api/v1/policy/active/current` - Get current active policy
- `POST /api/v1/policy/create` - Create new policy
- `PATCH /api/v1/policy/{id}/status` - Update policy status

**Updated Files:**
- `backend/main.py` - Registered policy router
- `backend/models.py` - Added `policyId` to FeedbackSubmitRequest
- `backend/api/feedback.py` - Updated feedback creation to include policyId

**Seed Data:** `backend/seed_policy.py`
- Creates sample CSR policy (Companies Act Amendment)
- Comprehensive policy with sections, proposed changes, timeline

### 3. Frontend Components
**New Component:** `frontend/components/PolicyContext.tsx`

Features:
- ✅ Displays policy title, description, status, category
- ✅ Shows version, feedback count, update date
- ✅ Expandable full policy text viewer (600px max height with scroll)
- ✅ Print policy button
- ✅ Call-to-action message encouraging feedback
- ✅ Clean blue gradient design matching dashboard

**Updated Files:**
- `frontend/lib/api.ts` - Added Policy types and policyAPI methods
- `frontend/app/admin/dashboard-new/page.tsx` - Integrated PolicyContext

### 4. Dashboard Integration
The policy context now appears at the top of the dashboard:
1. Fetches active policy on load
2. Displays policy card with expandable text
3. Automatically includes policyId when submitting feedback
4. Shows loading state while fetching policy

## Setup Instructions

### Step 1: Generate and Apply Database Migration
```powershell
cd backend
prisma db push
```

### Step 2: Seed Policy Data
```powershell
python seed_policy.py
```

Expected output:
```
=== Seeding Policy Data ===

✓ Created sample policy: <uuid>
  Title: Proposed Amendment to Companies Act, 2013 - Section 135 (CSR)
  Status: active

✓ Policy seeding complete! Policy ID: <uuid>
```

### Step 3: Restart Backend
```powershell
python main.py
```

### Step 4: Restart Frontend
```powershell
cd ../frontend
npm run dev
```

## Usage

### For Users:
1. Visit admin dashboard at `http://localhost:3001/admin/dashboard-new`
2. See policy context card at top of page
3. Click "Read Full Policy" to expand and read complete policy text
4. Submit feedback - it will automatically be linked to the active policy
5. Use "Print Policy" button to save or print policy document

### For Developers:

**Creating a New Policy:**
```typescript
import { policyAPI } from '@/lib/api';

const newPolicy = await policyAPI.create({
  title: "New Policy Title",
  description: "Brief description",
  fullText: "Complete policy text with markdown formatting",
  category: "Legal Category",
  version: "1.0",
  status: "draft" // or "active"
});
```

**Getting Active Policy:**
```typescript
const activePolicy = await policyAPI.getActive();
```

**Submitting Feedback with Policy Context:**
```typescript
import { feedbackAPI } from '@/lib/api';

await feedbackAPI.submit({
  text: "My feedback...",
  language: "English",
  stakeholderType: "Corporate",
  policyId: activePolicy.id
});
```

## API Endpoints

### Policy Endpoints
```
GET    /api/v1/policy/list?status=active&limit=100&offset=0
GET    /api/v1/policy/{policy_id}
GET    /api/v1/policy/active/current
POST   /api/v1/policy/create
PATCH  /api/v1/policy/{policy_id}/status?status=active
```

### Updated Feedback Endpoint
```
POST   /api/v1/feedback/
Body: {
  "text": "Feedback text",
  "language": "English",
  "stakeholderType": "Corporate",
  "policyId": "uuid-of-policy"  // NEW: Links feedback to policy
}
```

## Sample Policy
The seed script creates a comprehensive CSR policy amendment:
- **Title:** Proposed Amendment to Companies Act, 2013 - Section 135 (CSR)
- **Category:** Corporate Law
- **Key Changes:**
  - Increased CSR spending to 3% for large companies
  - Expanded eligible activities (climate change, digital literacy, MSMEs)
  - Stricter committee requirements
  - Tighter compliance deadlines
  - Enhanced penalties

## Benefits

### For Administrators:
- ✅ Clear policy visibility at top of dashboard
- ✅ Track feedback count per policy
- ✅ Manage multiple policies (draft/active/archived)
- ✅ Version control for policy changes

### For AI Analysis:
- ✅ Feedback is contextualized with specific policy
- ✅ AI can reference policy text when analyzing sentiment
- ✅ Better predictive impact simulation with policy context
- ✅ More accurate debate mapping per policy section

### For Users:
- ✅ See what they're commenting on
- ✅ Read full policy before submitting feedback
- ✅ Understand consultation context
- ✅ Print/save policy for reference

## Next Steps
To integrate policy context with AI features:
1. Update Policy Sandbox to include policy text in simulations
2. Enhance sentiment analysis to reference policy sections
3. Add policy-specific clustering (group feedback by policy section)
4. Create policy comparison tool for before/after versions

## Troubleshooting

**Error: "No active policy found"**
- Solution: Run `python seed_policy.py` to create sample policy
- Or: Create policy via API and set status to "active"

**Policy not showing in dashboard:**
- Check backend logs for errors
- Verify policy status is "active"
- Check frontend console for API errors

**Migration issues:**
- Delete `prisma/dev.db` (if using SQLite)
- Run `prisma db push` again
- Re-run seed scripts

## Files Modified/Created

### Backend (5 files)
- ✅ `backend/db/schema.prisma` - Added Policy model
- ✅ `backend/api/policy.py` - NEW: Policy API endpoints
- ✅ `backend/main.py` - Registered policy router
- ✅ `backend/models.py` - Updated FeedbackSubmitRequest
- ✅ `backend/api/feedback.py` - Added policyId to feedback creation
- ✅ `backend/seed_policy.py` - NEW: Policy seed script

### Frontend (3 files)
- ✅ `frontend/lib/api.ts` - Added Policy types and policyAPI
- ✅ `frontend/components/PolicyContext.tsx` - NEW: Policy display component
- ✅ `frontend/app/admin/dashboard-new/page.tsx` - Integrated PolicyContext

## Screenshots Description

The policy context appears as a prominent blue-gradient card showing:
- Policy icon (FileText)
- Title with status badge (ACTIVE) and category badge
- Brief description
- Metadata (version, feedback count, update date)
- "Read Full Policy" button
- When expanded: Full policy text in scrollable container
- Call-to-action message encouraging feedback

---
**Status:** ✅ Complete and ready for use
**Date:** December 2024
**Version:** 1.0
