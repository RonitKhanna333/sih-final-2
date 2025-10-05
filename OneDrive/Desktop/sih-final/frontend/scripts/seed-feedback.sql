-- Seed data for Feedback table
-- Run this in Supabase Dashboard > SQL Editor to populate sample feedback

-- Sample feedback with camelCase column names (if your table uses camelCase)
INSERT INTO "Feedback" (
  "text",
  "sentiment",
  "language",
  "nuances",
  "isSpam",
  "legalRiskScore",
  "complianceDifficultyScore",
  "businessGrowthScore",
  "stakeholderType",
  "sector",
  "summary",
  "edgeCaseFlags",
  "reasoning",
  "sentimentConfidence"
) VALUES
  (
    'This policy will greatly benefit small businesses by reducing compliance costs.',
    'Positive',
    'English',
    ARRAY['supportive', 'business-friendly'],
    false,
    2,
    3,
    8,
    'Business Owner',
    'SME',
    'Positive feedback on reduced compliance costs',
    ARRAY[]::text[],
    'Expresses clear support for policy benefits',
    0.92
  ),
  (
    'I am concerned about the environmental impact of these changes. More studies are needed.',
    'Negative',
    'English',
    ARRAY['concerned', 'environmental', 'cautious'],
    false,
    5,
    6,
    4,
    'Environmental Activist',
    'Environment',
    'Concerns about environmental impact',
    ARRAY['environmental_concern'],
    'Expresses environmental concerns and need for studies',
    0.87
  ),
  (
    'The proposal seems fair and balanced. It addresses most of our community concerns.',
    'Positive',
    'English',
    ARRAY['balanced', 'fair', 'community-focused'],
    false,
    1,
    2,
    7,
    'Community Leader',
    'Public',
    'Fair and balanced proposal',
    ARRAY[]::text[],
    'Positive assessment of fairness and balance',
    0.89
  ),
  (
    'This policy ignores the needs of rural communities. Urban bias is evident.',
    'Negative',
    'English',
    ARRAY['critical', 'rural-concern', 'urban-bias'],
    false,
    6,
    7,
    3,
    'Rural Farmer',
    'Agriculture',
    'Rural communities being ignored',
    ARRAY['geographic_inequality'],
    'Critical of urban bias and rural neglect',
    0.91
  ),
  (
    'Great initiative! This will create jobs and boost the economy.',
    'Positive',
    'English',
    ARRAY['enthusiastic', 'job-creation', 'economic-growth'],
    false,
    1,
    2,
    9,
    'Economist',
    'Finance',
    'Job creation and economic boost',
    ARRAY[]::text[],
    'Very positive about economic impact',
    0.95
  ),
  (
    'The implementation timeline is unrealistic. We need at least 2 more years.',
    'Negative',
    'English',
    ARRAY['concerned', 'timeline', 'implementation'],
    false,
    4,
    8,
    5,
    'Industry Expert',
    'Technology',
    'Unrealistic implementation timeline',
    ARRAY['timeline_concern'],
    'Concerned about feasibility of timeline',
    0.88
  ),
  (
    'We support this policy but request amendments to Section 4 regarding data privacy.',
    'Neutral',
    'English',
    ARRAY['supportive', 'privacy-concern', 'amendment-needed'],
    false,
    5,
    6,
    6,
    'Privacy Advocate',
    'Technology',
    'Support with privacy amendment request',
    ARRAY['data_privacy'],
    'Mixed sentiment - supportive but with concerns',
    0.76
  ),
  (
    'Excellent work by the policy team. This addresses long-standing issues.',
    'Positive',
    'English',
    ARRAY['appreciative', 'long-term-solution'],
    false,
    1,
    2,
    8,
    'Policy Analyst',
    'Government',
    'Addresses long-standing issues',
    ARRAY[]::text[],
    'Highly positive about policy effectiveness',
    0.94
  ),
  (
    'This will increase costs for consumers. The government should reconsider.',
    'Negative',
    'English',
    ARRAY['cost-concern', 'consumer-impact', 'reconsideration'],
    false,
    4,
    5,
    2,
    'Consumer Advocate',
    'Retail',
    'Increased consumer costs',
    ARRAY['cost_impact'],
    'Negative due to consumer cost concerns',
    0.90
  ),
  (
    'The transparency measures in this policy are commendable.',
    'Positive',
    'English',
    ARRAY['transparency', 'accountability', 'commendable'],
    false,
    1,
    2,
    7,
    'Transparency Advocate',
    'Civil Society',
    'Commendable transparency measures',
    ARRAY[]::text[],
    'Positive about transparency improvements',
    0.93
  );

-- If your table uses snake_case column names, use this instead:
-- Uncomment the INSERT below and comment out the camelCase one above

/*
INSERT INTO "Feedback" (
  "text",
  "sentiment",
  "language",
  "nuances",
  "is_spam",
  "legal_risk_score",
  "compliance_difficulty_score",
  "business_growth_score",
  "stakeholder_type",
  "sector",
  "summary",
  "edge_case_flags",
  "reasoning",
  "sentiment_confidence"
) VALUES
  -- (copy the same data as above but with snake_case column names)
  (
    'This policy will greatly benefit small businesses by reducing compliance costs.',
    'Positive',
    'English',
    ARRAY['supportive', 'business-friendly'],
    false,
    2,
    3,
    8,
    'Business Owner',
    'SME',
    'Positive feedback on reduced compliance costs',
    ARRAY[]::text[],
    'Expresses clear support for policy benefits',
    0.92
  )
  -- Add remaining records...
;
*/

-- Verify the inserted data
SELECT COUNT(*) as total_feedback FROM "Feedback";
SELECT sentiment, COUNT(*) FROM "Feedback" GROUP BY sentiment;
