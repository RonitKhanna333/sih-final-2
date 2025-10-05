# Seed Feedback Data - Quick Guide

## Problem
You can't see comments/feedback on your dashboard because the Supabase `Feedback` table is empty.

## Solution: Run the Seed Script

### Option 1: Run Node.js Seed Script (Easiest)

```bash
cd "c:/Users/Ronit Khanna/OneDrive/Desktop/sih-final/frontend"
node scripts/seed-feedback.js
```

**What it does:**
- Automatically inserts 10 sample feedback entries
- Detects if your table uses camelCase or snake_case columns
- Handles both naming conventions automatically

**Expected Output:**
```
🌱 Starting to seed feedback data...

✅ Successfully seeded 10 feedback entries
📊 Sample data breakdown:
   - Positive: 6
   - Negative: 3
   - Neutral: 1

✨ Seeding completed! Visit your app to see the feedback.
```

### Option 2: Run SQL in Supabase Dashboard

1. **Open Supabase SQL Editor**:
   https://supabase.com/dashboard/project/ibezvnwzacivmvqyqwcp/sql/new

2. **Copy the SQL** from `scripts/seed-feedback.sql`

3. **Click "Run"**

4. **Check your table**:
   - Go to: https://supabase.com/dashboard/project/ibezvnwzacivmvqyqwcp/editor
   - Click "Feedback" table
   - You should see 10 rows

### Option 3: Test via API (Manual)

Submit feedback through the UI:
1. Go to http://localhost:3000
2. Find the feedback form
3. Submit some test feedback manually

## Verify Feedback is Showing

After seeding:

1. **Go to your dashboard**: http://localhost:3000/admin/dashboard-new
   - Or client dashboard: http://localhost:3000/client/dashboard

2. **Check Feedback List**:
   - Should show 10 entries with different sentiments
   - Green cards = Positive
   - Red cards = Negative
   - Gray cards = Neutral

3. **Check Analytics**:
   - Sentiment distribution chart should update
   - Word cloud should generate
   - Clustering should work

## Troubleshooting

### "Can't see comments even after seeding"

**Check 1: Verify data exists in Supabase**
```sql
SELECT COUNT(*) FROM "Feedback";
```
Run this in Supabase SQL Editor. Should return 10 (or more).

**Check 2: Check browser console**
- Open DevTools (F12)
- Look for errors in Console tab
- Look for failed API calls in Network tab

**Check 3: Check column naming**
Your Feedback table might have wrong column names. Run this to check:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Feedback';
```

**Expected columns (camelCase):**
- `id`, `text`, `sentiment`, `language`
- `isSpam`, `legalRiskScore`, `complianceDifficultyScore`
- `businessGrowthScore`, `stakeholderType`, `sector`
- `createdAt`, `updatedAt`, `policyId`

**If you have snake_case columns:**
- The seed script auto-detects and converts
- But your Supabase schema needs to match Prisma schema

### "401 Unauthorized when fetching feedback"

Your auth might be blocking the API. Try:
1. Logout and login again
2. Check if you're logged in
3. Check Supabase RLS (Row Level Security) policies

**Disable RLS temporarily for testing:**
```sql
ALTER TABLE "Feedback" DISABLE ROW LEVEL SECURITY;
```

Then enable it back and add proper policies:
```sql
-- Allow public to read feedback
CREATE POLICY "Public read access" ON "Feedback"
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated insert" ON "Feedback"
  FOR INSERT WITH CHECK (true);
```

### "Column does not exist" error

Your table uses different column names. Check with:
```sql
\d "Feedback"
```

Then either:
- **Option A**: Rename columns in Supabase to match camelCase
- **Option B**: The API already has fallbacks for both naming styles

## Sample Data Overview

The seed script adds 10 feedback entries:

| Sentiment | Count | Stakeholder Types |
|-----------|-------|-------------------|
| Positive  | 6     | Business Owner, Community Leader, Economist, Policy Analyst, Transparency Advocate |
| Negative  | 3     | Environmental Activist, Rural Farmer, Industry Expert, Consumer Advocate |
| Neutral   | 1     | Privacy Advocate |

**Topics covered:**
- Business impact
- Environmental concerns
- Community fairness
- Rural vs Urban
- Economic growth
- Implementation timelines
- Data privacy
- Consumer costs
- Transparency

## Quick Commands

```bash
# Install dependencies (if not already)
npm install dotenv @supabase/supabase-js

# Run seed script
node scripts/seed-feedback.js

# Start dev server
npm run dev

# Check feedback via API
curl http://localhost:3000/api/feedback
```

## After Seeding

Visit these pages to see the data:
- **Feedback List**: http://localhost:3000/admin/dashboard-new
- **Analytics Dashboard**: http://localhost:3000/admin/dashboard-new (scroll down)
- **API Response**: http://localhost:3000/api/feedback

All dashboards should now show the seeded feedback! 🎉
