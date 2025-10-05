import { supabase, type Policy } from '@/lib/supabase';

export type PolicyRecord = Policy &
  Partial<{
    full_text: string;
    created_at: string;
    updated_at: string;
  }> & { feedback_count?: number };

function getValue<T = unknown>(record: PolicyRecord, ...keys: Array<keyof PolicyRecord | string>): T | undefined {
  for (const key of keys) {
    const value = (record as unknown as Record<string, unknown>)[String(key)];
    if (value !== undefined && value !== null) {
      return value as T;
    }
  }
  return undefined;
}

export async function enrichWithFeedbackCounts(policies: PolicyRecord[]) {
  return Promise.all(
    policies.map(async (policy) => {
      const { count, error } = await supabase
        .from('Feedback')
        .select('id', { count: 'exact', head: true })
        .eq('policyId', policy.id);

      if (error && error.code === '42703') {
        const legacy = await supabase
          .from('Feedback')
          .select('id', { count: 'exact', head: true })
          .eq('policy_id', policy.id);

        return {
          ...policy,
          feedback_count: legacy.count ?? 0,
        };
      }

      return {
        ...policy,
        feedback_count: count ?? 0,
      };
    })
  );
}

export function mapPolicyResponse(record: PolicyRecord) {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? '',
  fullText: getValue<string>(record, 'fullText', 'full_text') ?? '',
    version: record.version ?? '1.0',
    status: record.status ?? 'draft',
    category: record.category ?? undefined,
  createdAt: getValue<string>(record, 'createdAt', 'created_at'),
  updatedAt: getValue<string>(record, 'updatedAt', 'updated_at'),
    feedbackCount: record.feedback_count ?? 0,
  };
}
