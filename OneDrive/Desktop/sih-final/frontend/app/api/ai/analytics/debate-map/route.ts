import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { clusterFeedback, generateNarrativeFromClusters, getGroqEmbeddings } from '@/lib/groq';

const COLORS = ['#6366f1', '#10b981', '#f97316', '#ec4899', '#14b8a6', '#facc15'];

interface DebateMapPoint {
  id: string;
  x: number;
  y: number;
  clusterId: number;
  text: string;
  sentiment: string;
  stakeholderType: string | null;
}

interface DebateCluster {
  id: number;
  label: string;
  size: number;
  averageSentiment: string;
  keyThemes: string[];
  color: string;
}

interface ConflictZone {
  cluster1: string;
  cluster2: string;
  description: string;
}

type FeedbackRow = {
  id: string;
  text?: string | null;
  sentiment?: string | null;
  stakeholderType?: string | null;
  language?: string | null;
  createdAt?: string | null;
  policyId?: string | null;
} &
  Partial<{
    stakeholder_type: string | null;
    created_at: string | null;
    policy_id: string | null;
  }>;

const selectCamel = 'id, text, sentiment, stakeholderType, language, createdAt, policyId';
const selectLegacy = 'id, text, sentiment, stakeholder_type, language, created_at, policy_id';

function pickValue<T>(record: FeedbackRow, ...keys: Array<keyof FeedbackRow | string>): T | undefined {
  for (const key of keys) {
    const value = (record as unknown as Record<string, unknown>)[String(key)];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const policyId = url.searchParams.get('policyId');

    let { data, error } = await supabase
      .from('Feedback')
      .select(selectCamel)
      .order('createdAt', { ascending: true });

    if (error && error.code === '42703') {
      ({ data, error } = await supabase
        .from('Feedback')
        .select(selectLegacy)
        .order('created_at', { ascending: true }));
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to generate debate map' }, { status: 500 });
    }

    const rows = ((data ?? []) as FeedbackRow[]).filter((row) => {
      if (policyId) {
        return pickValue<string>(row, 'policyId', 'policy_id') === policyId;
      }
      return true;
    });

    if (!rows.length) {
      return NextResponse.json({
        points: [],
        clusters: [],
        narrative: 'No debate landscape yet — collect more feedback to unlock insights.',
        conflictZones: [],
        consensusAreas: [],
      });
    }

    const texts = rows.map((row) => row.text ?? '');
    
    let embeddings: number[][] = [];
    try {
      embeddings = await getGroqEmbeddings(texts);
    } catch (error) {
      console.error('Embedding generation failed, using fallback:', error);
      // Generate simple random embeddings as fallback
      embeddings = texts.map(() => Array.from({ length: 2 }, () => Math.random() * 2 - 1));
    }

    const clusterCount = Math.max(2, Math.min(5, Math.floor(rows.length / 3) || 2));
    let clusterResult: Awaited<ReturnType<typeof clusterFeedback>>;
    try {
      clusterResult = await clusterFeedback(
        rows.map((row) => ({ text: row.text ?? '' })),
        clusterCount
      );
    } catch (error) {
      console.error('Clustering failed, using fallback:', error);
      // Simple fallback clustering
      clusterResult = {
        clusters: [{
          id: 0,
          name: 'All Feedback',
          description: 'All feedback items',
          feedback_indices: rows.map((_, i) => i),
          key_themes: ['general feedback'],
        }],
      };
    }

    const assignments = new Array(rows.length).fill(-1);
    clusterResult.clusters.forEach((cluster, idx) => {
      const clusterId = cluster.id ?? idx;
      (cluster.feedback_indices ?? []).forEach((i) => {
        if (typeof i === 'number' && i < assignments.length) {
          assignments[i] = clusterId;
        }
      });
    });

    const points: DebateMapPoint[] = rows.map((row, index) => {
      const embedding = embeddings[index] ?? [];
      const [x, y] = projectVector(embedding, index);
      return {
        id: row.id,
        x,
        y,
        clusterId: assignments[index] ?? -1,
        text: row.text ?? '',
        sentiment: normalizeSentiment(row.sentiment),
        stakeholderType: pickValue<string>(row, 'stakeholderType', 'stakeholder_type') ?? null,
      };
    });

    const clusters: DebateCluster[] = clusterResult.clusters.map((cluster, idx) => {
      const clusterId = cluster.id ?? idx;
      const indices = cluster.feedback_indices ?? [];
      const clusterPoints = indices.map((i) => points[i]).filter(Boolean);
      const sentiments = clusterPoints.map((p) => p.sentiment);
      const averageSentiment = sentiments.length ? dominantSentiment(sentiments) : 'Neutral';

      return {
        id: clusterId,
        label: cluster.name ?? `Cluster ${idx + 1}`,
        size: clusterPoints.length,
        averageSentiment,
        keyThemes: cluster.key_themes ?? [],
        color: COLORS[idx % COLORS.length],
      };
    });

    const conflictZones = buildConflictZones(clusters);
    const consensusAreas = clusters
      .filter((cluster) => cluster.averageSentiment === 'Positive')
      .map((cluster) => cluster.label);

    let narrative = '';
    try {
      narrative = await generateNarrativeFromClusters(
        clusters.map((cluster) => ({
          name: cluster.label,
          description: `${cluster.size} items with ${cluster.averageSentiment.toLowerCase()} sentiment`,
        })),
        rows.length
      );
    } catch (error) {
      console.error('Narrative generation failed, using fallback:', error);
      narrative = `Analysis of ${rows.length} feedback items across ${clusters.length} clusters. ${
        consensusAreas.length > 0
          ? `Consensus found in: ${consensusAreas.join(', ')}.`
          : 'Mixed opinions across stakeholders.'
      }`;
    }

    return NextResponse.json({
      points,
      clusters,
      narrative,
      conflictZones,
      consensusAreas,
    });
  } catch (error) {
    console.error('Debate map error:', error);
    return NextResponse.json({ error: 'Failed to generate debate map' }, { status: 500 });
  }
}

function projectVector(vector: number[], seed: number): [number, number] {
  if (vector.length >= 2) {
    return [vector[0], vector[1]];
  }

  // Deterministic fallback using seed
  const x = pseudoRandom(seed) * 2 - 1;
  const y = pseudoRandom(seed + 42) * 2 - 1;
  return [x, y];
}

function pseudoRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function normalizeSentiment(sentiment?: string | null): 'Positive' | 'Negative' | 'Neutral' {
  const value = (sentiment ?? 'Neutral').toLowerCase();
  if (value.includes('pos')) return 'Positive';
  if (value.includes('neg')) return 'Negative';
  return 'Neutral';
}

function dominantSentiment(sentiments: string[]) {
  const counts: Record<string, number> = { Positive: 0, Negative: 0, Neutral: 0 };
  sentiments.forEach((sentiment) => {
    counts[sentiment] = (counts[sentiment] ?? 0) + 1;
  });

  return (Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] as 'Positive' | 'Negative' | 'Neutral') ?? 'Neutral';
}

function buildConflictZones(clusters: DebateCluster[]): ConflictZone[] {
  const negativeClusters = clusters.filter((cluster) => cluster.averageSentiment === 'Negative');
  const positiveClusters = clusters.filter((cluster) => cluster.averageSentiment === 'Positive');

  const zones: ConflictZone[] = [];

  negativeClusters.forEach((negCluster) => {
    positiveClusters.forEach((posCluster) => {
      zones.push({
        cluster1: negCluster.label,
        cluster2: posCluster.label,
        description: `Diverging viewpoints between ${negCluster.label} and ${posCluster.label}.`,
      });
    });
  });

  return zones.slice(0, 3);
}
