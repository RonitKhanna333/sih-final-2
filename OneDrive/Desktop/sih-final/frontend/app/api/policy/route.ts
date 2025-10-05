import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { enrichWithFeedbackCounts, mapPolicyResponse, type PolicyRecord } from './utils';

interface PolicyCreatePayload {
  title: string;
  description: string;
  fullText?: string;
  full_text?: string;
  category?: string;
  version?: string;
  status?: string;
}

interface PolicyListResponse {
  data: Array<ReturnType<typeof mapPolicyResponse>>;
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 200);
    const offset = Number(url.searchParams.get('offset') ?? 0);

    const buildQuery = (orderColumn: string) => {
      let query = supabase
        .from('Policy')
        .select('*', { count: 'exact' })
        .order(orderColumn, { ascending: false })
        .range(offset, offset + limit - 1);

      if (status) {
        query = query.eq('status', status);
      }

      return query;
    };

    let { data, error, count } = await buildQuery('createdAt');

    if (error && error.code === '42703') {
      ({ data, error, count } = await buildQuery('created_at'));
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to load policies' }, { status: 500 });
    }

    const policies = await enrichWithFeedbackCounts((data ?? []) as PolicyRecord[]);

    const response: PolicyListResponse = {
      data: policies.map(mapPolicyResponse),
      total: count ?? policies.length,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Policy list error:', error);
    return NextResponse.json({ error: 'Failed to load policies' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PolicyCreatePayload;
    const client = supabaseAdmin ?? supabase;

    const fullText = body.fullText ?? body.full_text ?? '';

    const insertPayload = {
      title: body.title,
      description: body.description,
      fullText,
      category: body.category ?? null,
      version: body.version ?? '1.0',
      status: body.status ?? 'draft',
    };

    const { data, error } = await client.from('Policy').insert(insertPayload as never).select().single();

    if (error && error.code === '42703') {
      const legacyPayload = {
        ...insertPayload,
        full_text: insertPayload.fullText,
      };
      delete (legacyPayload as Record<string, unknown>).fullText;

      const legacyResult = await client.from('Policy').insert(legacyPayload as never).select().single();

      if (legacyResult.error) {
        console.error('Supabase error:', legacyResult.error);
        return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
      }

      const policies = await enrichWithFeedbackCounts([legacyResult.data as PolicyRecord]);

      return NextResponse.json(mapPolicyResponse(policies[0]), { status: 201 });
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
    }

    const policies = await enrichWithFeedbackCounts([data as PolicyRecord]);

    return NextResponse.json(mapPolicyResponse(policies[0]), { status: 201 });
  } catch (error) {
    console.error('Policy create error:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}

