import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin, type FeedbackInsert } from '@/lib/supabase';
import { analyzeFeedbackGroq } from '@/lib/groq';

const MAX_LIMIT = 200;

type FeedbackRow = {
  id: string;
  text?: string | null;
  sentiment?: string | null;
  language?: string | null;
  nuances?: string[] | null;
  isSpam?: boolean | null;
  legalRiskScore?: number | null;
  complianceDifficultyScore?: number | null;
  businessGrowthScore?: number | null;
  stakeholderType?: string | null;
  sector?: string | null;
  summary?: string | null;
  edgeCaseFlags?: string[] | null;
  policyId?: string | null;
  sentimentConfidence?: number | null;
  reasoning?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
} & Partial<{
  is_spam: boolean | null;
  legal_risk_score: number | null;
  compliance_difficulty_score: number | null;
  business_growth_score: number | null;
  stakeholder_type: string | null;
  edge_case_flags: string[] | null;
  policy_id: string | null;
  sentiment_confidence: number | null;
  created_at: string | null;
  updated_at: string | null;
}>;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, stakeholderType, sector, policyId } = body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const analysis = await analyzeFeedbackGroq(text);
    const summary = text.length > 160 ? `${text.slice(0, 157)}...` : text;

    // Create minimal insert payload with only essential fields
    // Supabase table may not have all optional columns like reasoning, sentimentConfidence, embedding
    const insertPayload: FeedbackInsert = {
      text: text.trim(),
      sentiment: analysis.sentiment,
      language: analysis.language,
      nuances: analysis.nuances,
      isSpam: analysis.isSpam,
      legalRiskScore: analysis.scores.legalRisk,
      complianceDifficultyScore: analysis.scores.complianceDifficulty,
      businessGrowthScore: analysis.scores.businessGrowth,
      stakeholderType: stakeholderType ?? null,
      sector: sector ?? null,
      policyId: policyId ?? null,
      edgeCaseFlags: analysis.nuances,
      summary,
      // Note: Optional fields (reasoning, sentimentConfidence, embedding) commented out
      // Uncomment if your Supabase table has these columns
      // reasoning: analysis.reasoning,
      // sentimentConfidence: analysis.confidence,
    };

    const client = supabaseAdmin ?? supabase;

    let { data, error } = await client
      .from('Feedback')
      .insert(insertPayload as never)
      .select()
      .single();

    if (error && error.code === '42703') {
      // Column not found, try with snake_case
      const legacyPayload = toLegacyFeedbackPayload(insertPayload);
      ({ data, error } = await client.from('Feedback').insert(legacyPayload as never).select().single());
    }
    
    // If still failing due to missing columns, try with minimal fields only
    if (error && error.code === 'PGRST204') {
      console.log('Retrying with minimal fields only...');
      const minimalPayload = {
        text: text.trim(),
        sentiment: analysis.sentiment || 'Neutral',
        language: analysis.language || 'English',
        stakeholder_type: stakeholderType ?? null,
        sector: sector ?? null,
      };
      ({ data, error } = await client.from('Feedback').insert(minimalPayload as never).select().single());
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json(mapFeedbackRecord(data as FeedbackRow));
  } catch (error) {
    console.error('Feedback error:', error);
    return NextResponse.json({ error: 'Failed to process feedback' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), MAX_LIMIT);
    const offset = Number(searchParams.get('offset') ?? 0);
    const policyId = searchParams.get('policyId');

    const buildQuery = (orderColumn: string, policyColumn: string) => {
      let query = supabase
        .from('Feedback')
        .select('*', { count: 'exact' })
        .order(orderColumn, { ascending: false })
        .range(offset, offset + limit - 1);

      if (policyId) {
        query = query.eq(policyColumn, policyId);
      }

      return query;
    };

    let { data, error, count } = await buildQuery('createdAt', 'policyId');

    if (error && error.code === '42703') {
      ({ data, error, count } = await buildQuery('created_at', 'policy_id'));
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to retrieve feedback' }, { status: 500 });
    }

    const feedback = (data ?? []).map((record) => mapFeedbackRecord(record as FeedbackRow));
    const total = count ?? feedback.length;
    const page = Math.floor(offset / limit) + 1;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      data: feedback,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Feedback retrieval error:', error);
    return NextResponse.json({ error: 'Failed to retrieve feedback' }, { status: 500 });
  }
}

function mapFeedbackRecord(record: FeedbackRow) {
  const toValue = <T>(...keys: Array<keyof FeedbackRow | keyof Required<FeedbackRow>>): T | undefined => {
    for (const key of keys) {
      const value = (record as Record<string, unknown>)[key as string];
      if (value !== undefined && value !== null) {
        return value as T;
      }
    }
    return undefined;
  };

  return {
    id: record.id,
    text: record.text,
    sentiment: record.sentiment ?? 'Neutral',
    language: record.language ?? 'English',
    nuances: record.nuances ?? [],
    isSpam: toValue<boolean>('isSpam', 'is_spam') ?? false,
    legalRiskScore: toValue<number>('legalRiskScore', 'legal_risk_score') ?? 0,
    complianceDifficultyScore:
      toValue<number>('complianceDifficultyScore', 'compliance_difficulty_score') ?? 0,
    businessGrowthScore: toValue<number>('businessGrowthScore', 'business_growth_score') ?? 0,
    stakeholderType: toValue<string | null>('stakeholderType', 'stakeholder_type') ?? undefined,
    sector: record.sector ?? undefined,
    summary: record.summary ?? undefined,
    edgeCaseFlags: toValue<string[]>('edgeCaseFlags', 'edge_case_flags') ?? [],
    policyId: toValue<string>('policyId', 'policy_id') ?? undefined,
    sentimentConfidence: toValue<number>('sentimentConfidence', 'sentiment_confidence'),
    reasoning: record.reasoning ?? undefined,
    createdAt: toValue<string>('createdAt', 'created_at'),
    updatedAt: toValue<string>('updatedAt', 'updated_at'),
  };
}

function toLegacyFeedbackPayload(payload: FeedbackInsert) {
  const legacy: Record<string, unknown> = { ...payload };

  if ('isSpam' in legacy) {
    legacy.is_spam = legacy.isSpam;
    delete legacy.isSpam;
  }
  if ('legalRiskScore' in legacy) {
    legacy.legal_risk_score = legacy.legalRiskScore;
    delete legacy.legalRiskScore;
  }
  if ('complianceDifficultyScore' in legacy) {
    legacy.compliance_difficulty_score = legacy.complianceDifficultyScore;
    delete legacy.complianceDifficultyScore;
  }
  if ('businessGrowthScore' in legacy) {
    legacy.business_growth_score = legacy.businessGrowthScore;
    delete legacy.businessGrowthScore;
  }
  if ('stakeholderType' in legacy) {
    legacy.stakeholder_type = legacy.stakeholderType;
    delete legacy.stakeholderType;
  }
  if ('policyId' in legacy) {
    legacy.policy_id = legacy.policyId;
    delete legacy.policyId;
  }
  if ('edgeCaseFlags' in legacy) {
    legacy.edge_case_flags = legacy.edgeCaseFlags;
    delete legacy.edgeCaseFlags;
  }
  if ('sentimentConfidence' in legacy) {
    legacy.sentiment_confidence = legacy.sentimentConfidence;
    delete legacy.sentimentConfidence;
  }

  return legacy;
}
