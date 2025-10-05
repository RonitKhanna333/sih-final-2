-- Fix Feedback table to auto-generate IDs and set proper defaults
-- Run this in your Supabase SQL Editor
-- NOTE: Using camelCase column names (createdAt, updatedAt)

-- 1. Add default UUID generation for id column
ALTER TABLE "Feedback" 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 2. Add default timestamps (camelCase columns)
ALTER TABLE "Feedback" 
ALTER COLUMN "createdAt" SET DEFAULT now();

ALTER TABLE "Feedback" 
ALTER COLUMN "updatedAt" SET DEFAULT now();

-- 3. Create trigger to auto-update updatedAt
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON "Feedback" 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Verify the changes
SELECT column_name, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'Feedback'
ORDER BY ordinal_position;
