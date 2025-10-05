import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clusterFeedback, generateNarrativeFromClusters } from '@/lib/groq';

interface ClusterRequest {
  num_clusters?: number;
  policyId?: string;
}

interface FeedbackRow {
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
  createdAt?: string | null;
  updatedAt?: string | null;
}

type LegacyFeedbackRow = FeedbackRow &
  Partial<{
    is_spam: boolean | null;
    legal_risk_score: number | null;
    compliance_difficulty_score: number | null;
    business_growth_score: number | null;
    stakeholder_type: string | null;
    edge_case_flags: string[] | null;
    policy_id: string | null;
    created_at: string | null;
    updated_at: string | null;
  }>;

interface ClusterFeedbackEntry {
  id: string;
  text: string | null | undefined;
  sentiment: string;
  language: string;
  nuances: string[];
  isSpam: boolean;
  legalRiskScore: number;
  complianceDifficultyScore: number;
  businessGrowthScore: number;
  stakeholderType?: string;
  sector?: string;
  summary?: string;
  edgeCaseFlags: string[];
  policyId?: string;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ClusterRequest;
  return handleClustering({
    num_clusters: body.num_clusters ?? 5,
    policyId: body.policyId,
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  return handleClustering({
    num_clusters: Number(url.searchParams.get('num_clusters') ?? 5),
    policyId: url.searchParams.get('policyId') ?? undefined,
  });
}

async function handleClustering(params: ClusterRequest) {
  try {
    const { num_clusters = 5, policyId } = params;

    let { data, error } = await supabase
      .from('Feedback')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error && error.code === '42703') {
      ({ data, error } = await supabase
        .from('Feedback')
        .select('*')
        .order('created_at', { ascending: false }));
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback for clustering' }, { status: 500 });
    }

    console.log(`[Clustering] Fetched ${data?.length || 0} feedback items from database`);

    const rows = (data ?? []) as LegacyFeedbackRow[];
    const filtered = policyId
      ? rows.filter((row) => pickValue<string>(row, 'policyId', 'policy_id') === policyId)
      : rows;

    console.log(`[Clustering] Filtered to ${filtered.length} items (policyId: ${policyId || 'all'})`);

    if (!filtered.length) {
      return NextResponse.json({
        clusters: {},
        silhouetteScore: null,
        numClusters: 0,
        narrative: 'No feedback available yet to generate clusters. Gather more input to unlock debate insights.',
      });
    }

    const clusterResult = await clusterFeedback(
      filtered.map((row) => ({ text: row.text?.trim() ?? '' })),
      num_clusters
    );
    const clusterMap: Record<string, ClusterFeedbackEntry[]> = {};

    clusterResult.clusters.forEach((cluster, idx) => {
      const key = cluster.name || `Cluster ${idx + 1}`;
      const indices = cluster.feedback_indices ?? [];
      clusterMap[key] = indices
    .map((i) => (filtered[i] ? mapFeedbackRecord(filtered[i]) : null))
        .filter((item): item is ClusterFeedbackEntry => item !== null);
    });

    const narrative = await generateNarrativeFromClusters(
      clusterResult.clusters.map((cluster) => ({
        name: cluster.name,
        description: cluster.description,
      })),
      filtered.length
    );

    return NextResponse.json({
      clusters: clusterMap,
      silhouetteScore: null,
      numClusters: clusterResult.clusters.length,
      narrative,
    });
  } catch (error) {
    console.error('Clustering error:', error);
    return NextResponse.json({ error: 'Clustering failed' }, { status: 500 });
  }
}

function pickValue<T>(record: LegacyFeedbackRow, ...keys: Array<keyof LegacyFeedbackRow | string>): T | undefined {
  for (const key of keys) {
    const value = (record as unknown as Record<string, unknown>)[String(key)];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }
  return undefined;
}

function mapFeedbackRecord(record: LegacyFeedbackRow): ClusterFeedbackEntry {
  return {
    id: record.id,
    text: record.text,
    sentiment: record.sentiment ?? 'Neutral',
    language: record.language ?? 'English',
    nuances: record.nuances ?? [],
    isSpam: pickValue<boolean>(record, 'isSpam', 'is_spam') ?? false,
    legalRiskScore: pickValue<number>(record, 'legalRiskScore', 'legal_risk_score') ?? 0,
    complianceDifficultyScore:
      pickValue<number>(record, 'complianceDifficultyScore', 'compliance_difficulty_score') ?? 0,
    businessGrowthScore: pickValue<number>(record, 'businessGrowthScore', 'business_growth_score') ?? 0,
    stakeholderType: pickValue<string>(record, 'stakeholderType', 'stakeholder_type') ?? undefined,
    sector: record.sector ?? undefined,
    summary: record.summary ?? undefined,
    edgeCaseFlags: pickValue<string[]>(record, 'edgeCaseFlags', 'edge_case_flags') ?? [],
    policyId: pickValue<string>(record, 'policyId', 'policy_id') ?? undefined,
    createdAt: pickValue<string>(record, 'createdAt', 'created_at'),
    updatedAt: pickValue<string>(record, 'updatedAt', 'updated_at'),
  };
}
