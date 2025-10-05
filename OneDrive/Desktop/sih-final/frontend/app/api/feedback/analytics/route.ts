import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type FeedbackAnalyticsRow = {
  sentiment?: string | null;
  isSpam?: boolean | null;
  legalRiskScore?: number | null;
  complianceDifficultyScore?: number | null;
  businessGrowthScore?: number | null;
  createdAt?: string | null;
  edgeCaseFlags?: string[] | null;
  policyId?: string | null;
} &
  Partial<{
    is_spam: boolean | null;
    legal_risk_score: number | null;
    compliance_difficulty_score: number | null;
    business_growth_score: number | null;
    created_at: string | null;
    edge_case_flags: string[] | null;
    policy_id: string | null;
  }>;

const camelColumns =
  'sentiment, isSpam, legalRiskScore, complianceDifficultyScore, businessGrowthScore, createdAt, edgeCaseFlags, policyId';
const legacyColumns =
  'sentiment, is_spam, legal_risk_score, compliance_difficulty_score, business_growth_score, created_at, edge_case_flags, policy_id';

const pickValue = <TValue = unknown>(
  row: FeedbackAnalyticsRow,
  ...keys: Array<keyof FeedbackAnalyticsRow | string>
): TValue | undefined => {
  for (const key of keys) {
    const value = (row as unknown as Record<string, unknown>)[String(key)];
    if (value !== undefined && value !== null) {
      return value as TValue;
    }
  }
  return undefined;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const policyId = searchParams.get('policyId');

    const buildQuery = (columns: string) => {
      let query = supabase.from('Feedback').select(columns);
      if (policyId) {
        query = query.eq(columns === camelColumns ? 'policyId' : 'policy_id', policyId);
      }
      return query;
    };

    let { data, error } = await buildQuery(camelColumns);

    if (error && error.code === '42703') {
      ({ data, error } = await buildQuery(legacyColumns));
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    const sentimentDistribution = { Positive: 0, Negative: 0, Neutral: 0 };
    let spamCount = 0;
    let legalRiskTotal = 0;
    let complianceTotal = 0;
    let growthTotal = 0;

    const concernBuckets: Record<string, { count: number; percent: number }> = {};

    const rows = (data ?? []) as FeedbackAnalyticsRow[];

    rows.forEach((row) => {
      const sentiment = normalizeSentiment(row.sentiment);
      sentimentDistribution[sentiment] += 1;

      if (pickValue(row, 'isSpam', 'is_spam')) {
        spamCount += 1;
      }

      legalRiskTotal += pickValue<number>(row, 'legalRiskScore', 'legal_risk_score') ?? 0;
      complianceTotal += pickValue<number>(row, 'complianceDifficultyScore', 'compliance_difficulty_score') ?? 0;
      growthTotal += pickValue<number>(row, 'businessGrowthScore', 'business_growth_score') ?? 0;

      const bucket = toMonthBucket(pickValue<string>(row, 'createdAt', 'created_at'));
      if (!concernBuckets[bucket]) {
        concernBuckets[bucket] = { count: 0, percent: 0 };
      }
      const flags = pickValue<string[]>(row, 'edgeCaseFlags', 'edge_case_flags');
      concernBuckets[bucket].count += Array.isArray(flags) ? flags.length || 1 : 1;
    });

    const totalFeedback = data?.length ?? 0;

    Object.keys(concernBuckets).forEach((bucket) => {
      concernBuckets[bucket].percent = totalFeedback
        ? parseFloat(((concernBuckets[bucket].count / totalFeedback) * 100).toFixed(2))
        : 0;
    });

    const average = (sum: number) => (totalFeedback ? parseFloat((sum / totalFeedback).toFixed(2)) : 0);

    // Calculate unique languages and stakeholder types (simplified - you can enhance this)
    const uniqueLanguages = new Set(rows.map(r => r.sentiment)).size; // Placeholder
    const uniqueStakeholderTypes = new Set().size; // Placeholder

    return NextResponse.json({
      // Original format
      sentimentDistribution,
      historicalConcernPatterns: concernBuckets,
      totalFeedback,
      spamCount,
      averageLegalRisk: average(legalRiskTotal),
      averageComplianceDifficulty: average(complianceTotal),
      averageBusinessGrowth: average(growthTotal),
      
      // Dashboard-compatible format
      totalSubmissions: totalFeedback,
      averageSubmissionsPerDay: totalFeedback > 0 ? Math.ceil(totalFeedback / 30) : 0,
      positiveFeedback: sentimentDistribution.Positive,
      negativeFeedback: sentimentDistribution.Negative,
      neutralFeedback: sentimentDistribution.Neutral,
      totalLanguages: Math.max(1, uniqueLanguages),
      totalStakeholderTypes: Math.max(1, uniqueStakeholderTypes),
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Failed to process analytics' }, { status: 500 });
  }
}

function normalizeSentiment(sentiment?: string | null): 'Positive' | 'Negative' | 'Neutral' {
  const normalized = (sentiment ?? 'Neutral').toLowerCase();
  if (normalized.includes('pos')) return 'Positive';
  if (normalized.includes('neg')) return 'Negative';
  return 'Neutral';
}

function toMonthBucket(dateValue?: string | null): string {
  if (!dateValue) return 'Unknown';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
