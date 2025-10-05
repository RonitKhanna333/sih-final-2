/**
 * Seed script to populate Supabase with sample feedback data
 * Run this to add demo comments/feedback to your database
 * 
 * Usage: node scripts/seed-feedback.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample feedback data matching the camelCase schema
const sampleFeedback = [
  {
    text: 'This policy will greatly benefit small businesses by reducing compliance costs.',
    sentiment: 'Positive',
    language: 'English',
    nuances: ['supportive', 'business-friendly'],
    isSpam: false,
    legalRiskScore: 2,
    complianceDifficultyScore: 3,
    businessGrowthScore: 8,
    stakeholderType: 'Business Owner',
    sector: 'SME',
    summary: 'Positive feedback on reduced compliance costs',
    edgeCaseFlags: [],
    reasoning: 'Expresses clear support for policy benefits',
    sentimentConfidence: 0.92
  },
  {
    text: 'I am concerned about the environmental impact of these changes. More studies are needed.',
    sentiment: 'Negative',
    language: 'English',
    nuances: ['concerned', 'environmental', 'cautious'],
    isSpam: false,
    legalRiskScore: 5,
    complianceDifficultyScore: 6,
    businessGrowthScore: 4,
    stakeholderType: 'Environmental Activist',
    sector: 'Environment',
    summary: 'Concerns about environmental impact',
    edgeCaseFlags: ['environmental_concern'],
    reasoning: 'Expresses environmental concerns and need for studies',
    sentimentConfidence: 0.87
  },
  {
    text: 'The proposal seems fair and balanced. It addresses most of our community concerns.',
    sentiment: 'Positive',
    language: 'English',
    nuances: ['balanced', 'fair', 'community-focused'],
    isSpam: false,
    legalRiskScore: 1,
    complianceDifficultyScore: 2,
    businessGrowthScore: 7,
    stakeholderType: 'Community Leader',
    sector: 'Public',
    summary: 'Fair and balanced proposal',
    edgeCaseFlags: [],
    reasoning: 'Positive assessment of fairness and balance',
    sentimentConfidence: 0.89
  },
  {
    text: 'This policy ignores the needs of rural communities. Urban bias is evident.',
    sentiment: 'Negative',
    language: 'English',
    nuances: ['critical', 'rural-concern', 'urban-bias'],
    isSpam: false,
    legalRiskScore: 6,
    complianceDifficultyScore: 7,
    businessGrowthScore: 3,
    stakeholderType: 'Rural Farmer',
    sector: 'Agriculture',
    summary: 'Rural communities being ignored',
    edgeCaseFlags: ['geographic_inequality'],
    reasoning: 'Critical of urban bias and rural neglect',
    sentimentConfidence: 0.91
  },
  {
    text: 'Great initiative! This will create jobs and boost the economy.',
    sentiment: 'Positive',
    language: 'English',
    nuances: ['enthusiastic', 'job-creation', 'economic-growth'],
    isSpam: false,
    legalRiskScore: 1,
    complianceDifficultyScore: 2,
    businessGrowthScore: 9,
    stakeholderType: 'Economist',
    sector: 'Finance',
    summary: 'Job creation and economic boost',
    edgeCaseFlags: [],
    reasoning: 'Very positive about economic impact',
    sentimentConfidence: 0.95
  },
  {
    text: 'The implementation timeline is unrealistic. We need at least 2 more years.',
    sentiment: 'Negative',
    language: 'English',
    nuances: ['concerned', 'timeline', 'implementation'],
    isSpam: false,
    legalRiskScore: 4,
    complianceDifficultyScore: 8,
    businessGrowthScore: 5,
    stakeholderType: 'Industry Expert',
    sector: 'Technology',
    summary: 'Unrealistic implementation timeline',
    edgeCaseFlags: ['timeline_concern'],
    reasoning: 'Concerned about feasibility of timeline',
    sentimentConfidence: 0.88
  },
  {
    text: 'We support this policy but request amendments to Section 4 regarding data privacy.',
    sentiment: 'Neutral',
    language: 'English',
    nuances: ['supportive', 'privacy-concern', 'amendment-needed'],
    isSpam: false,
    legalRiskScore: 5,
    complianceDifficultyScore: 6,
    businessGrowthScore: 6,
    stakeholderType: 'Privacy Advocate',
    sector: 'Technology',
    summary: 'Support with privacy amendment request',
    edgeCaseFlags: ['data_privacy'],
    reasoning: 'Mixed sentiment - supportive but with concerns',
    sentimentConfidence: 0.76
  },
  {
    text: 'Excellent work by the policy team. This addresses long-standing issues.',
    sentiment: 'Positive',
    language: 'English',
    nuances: ['appreciative', 'long-term-solution'],
    isSpam: false,
    legalRiskScore: 1,
    complianceDifficultyScore: 2,
    businessGrowthScore: 8,
    stakeholderType: 'Policy Analyst',
    sector: 'Government',
    summary: 'Addresses long-standing issues',
    edgeCaseFlags: [],
    reasoning: 'Highly positive about policy effectiveness',
    sentimentConfidence: 0.94
  },
  {
    text: 'This will increase costs for consumers. The government should reconsider.',
    sentiment: 'Negative',
    language: 'English',
    nuances: ['cost-concern', 'consumer-impact', 'reconsideration'],
    isSpam: false,
    legalRiskScore: 4,
    complianceDifficultyScore: 5,
    businessGrowthScore: 2,
    stakeholderType: 'Consumer Advocate',
    sector: 'Retail',
    summary: 'Increased consumer costs',
    edgeCaseFlags: ['cost_impact'],
    reasoning: 'Negative due to consumer cost concerns',
    sentimentConfidence: 0.90
  },
  {
    text: 'The transparency measures in this policy are commendable.',
    sentiment: 'Positive',
    language: 'English',
    nuances: ['transparency', 'accountability', 'commendable'],
    isSpam: false,
    legalRiskScore: 1,
    complianceDifficultyScore: 2,
    businessGrowthScore: 7,
    stakeholderType: 'Transparency Advocate',
    sector: 'Civil Society',
    summary: 'Commendable transparency measures',
    edgeCaseFlags: [],
    reasoning: 'Positive about transparency improvements',
    sentimentConfidence: 0.93
  }
];

async function seedFeedback() {
  console.log('🌱 Starting to seed feedback data...\n');

  try {
    // Insert feedback
    const { data, error } = await supabase
      .from('Feedback')
      .insert(sampleFeedback)
      .select();

    if (error) {
      console.error('❌ Error inserting feedback:', error);
      
      // Check if it's a column naming issue
      if (error.code === '42703') {
        console.log('\n⚠️  Column naming mismatch detected!');
        console.log('Your Supabase table might be using snake_case columns.');
        console.log('Converting to snake_case and retrying...\n');
        
        // Convert to snake_case
        const legacyFeedback = sampleFeedback.map(fb => ({
          text: fb.text,
          sentiment: fb.sentiment,
          language: fb.language,
          nuances: fb.nuances,
          is_spam: fb.isSpam,
          legal_risk_score: fb.legalRiskScore,
          compliance_difficulty_score: fb.complianceDifficultyScore,
          business_growth_score: fb.businessGrowthScore,
          stakeholder_type: fb.stakeholderType,
          sector: fb.sector,
          summary: fb.summary,
          edge_case_flags: fb.edgeCaseFlags,
          reasoning: fb.reasoning,
          sentiment_confidence: fb.sentimentConfidence,
        }));

        const { data: legacyData, error: legacyError } = await supabase
          .from('Feedback')
          .insert(legacyFeedback)
          .select();

        if (legacyError) {
          throw legacyError;
        }

        console.log(`✅ Successfully seeded ${legacyData.length} feedback entries (snake_case)`);
        return;
      }

      throw error;
    }

    console.log(`✅ Successfully seeded ${data.length} feedback entries (camelCase)`);
    console.log('\n📊 Sample data breakdown:');
    console.log(`   - Positive: ${sampleFeedback.filter(f => f.sentiment === 'Positive').length}`);
    console.log(`   - Negative: ${sampleFeedback.filter(f => f.sentiment === 'Negative').length}`);
    console.log(`   - Neutral: ${sampleFeedback.filter(f => f.sentiment === 'Neutral').length}`);
    
  } catch (err) {
    console.error('❌ Failed to seed feedback:', err);
    process.exit(1);
  }

  console.log('\n✨ Seeding completed! Visit your app to see the feedback.');
  console.log('   Local: http://localhost:3000');
}

// Run the seed function
seedFeedback();
