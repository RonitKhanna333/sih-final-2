# 🔧 Fix Supabase Table - URGENT

## Problem
Your Supabase `Feedback` table is missing default values for the `id` column, causing inserts to fail with:
```
null value in column "id" violates not-null constraint
```

## Solution: Run SQL in Supabase Dashboard

### **Step 1: Open Supabase SQL Editor**

1. Go to https://supabase.com/dashboard
2. Select your project: `ibezwnwzacivmvqyqwcp`
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### **Step 2: Copy and Run This SQL**

```sql
-- Fix Feedback table to auto-generate IDs (camelCase columns)
ALTER TABLE "Feedback" 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Add default timestamps (using camelCase column names)
ALTER TABLE "Feedback" 
ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE "Feedback" 
ALTER COLUMN "updatedAt" SET DEFAULT now();

-- Create auto-update trigger for updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at 
BEFORE UPDATE ON "Feedback" 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
```

### **Step 3: Click "Run" (or press Ctrl+Enter)**

You should see:
```
Success. No rows returned
```

### **Step 4: Run the Seed Script Again**

Back in your VS Code terminal:

```powershell
node scripts/seed-via-api.js
```

This time it should work! ✅

---

## Alternative: Use Supabase Table Editor

If you prefer using the UI:

1. Go to **Table Editor** → **Feedback** table
2. Click on the `id` column header
3. Set **Default Value**: `gen_random_uuid()`
4. Click **Save**

Then do the same for:
- `created_at` → Default: `now()`
- `updated_at` → Default: `now()`

---

## Expected Result

After running the seed script, you should see:

```
🔍 Checking if dev server is running...
✅ Server is running

🌱 Starting to seed feedback data...
📝 Attempting to login...
✅ Login successful

[1/10] Adding: "This policy will greatly benefit..."
   ✅ Added successfully (ID: abc123...)
[2/10] Adding: "I appreciate the government's effort..."
   ✅ Added successfully (ID: def456...)
...
============================================================
✅ Successfully added: 10 feedback entries
❌ Failed: 0 feedback entries
============================================================
```

Then refresh your dashboard and everything should work! 🎉

---

## Quick Check

To verify the fix worked, run this in Supabase SQL Editor:

```sql
SELECT column_name, column_default 
FROM information_schema.columns
WHERE table_name = 'Feedback' 
AND column_name IN ('id', 'created_at', 'updated_at');
```

You should see:
- `id` → `gen_random_uuid()`
- `created_at` → `now()`
- `updated_at` → `now()`
