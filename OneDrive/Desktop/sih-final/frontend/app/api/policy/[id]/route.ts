import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { enrichWithFeedbackCounts, mapPolicyResponse, type PolicyRecord } from '../utils';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase.from('Policy').select('*').eq('id', params.id).single();

    if (error || !data) {
      return NextResponse.json({ error: 'Policy not found' }, { status: 404 });
    }

    const [policy] = await enrichWithFeedbackCounts([data as PolicyRecord]);
    return NextResponse.json(mapPolicyResponse(policy));
  } catch (error) {
    console.error('Policy fetch error:', error);
    return NextResponse.json({ error: 'Failed to retrieve policy' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
  type PolicyUpdateBody = Partial<PolicyRecord> & { status?: string; fullText?: string };
    const body = (await request.json().catch(() => ({}))) as PolicyUpdateBody;
    const statusFromQuery = new URL(request.url).searchParams.get('status');

    const updatePayload: Record<string, unknown> = {};

    if (statusFromQuery) {
      updatePayload.status = statusFromQuery;
    }

    if (body.title) updatePayload.title = body.title;
    if (body.description) updatePayload.description = body.description;
    const fullText = body.fullText ?? (body as Record<string, unknown>).full_text;
    if (typeof fullText === 'string') {
      updatePayload.fullText = fullText;
    }
    if (body.category !== undefined) updatePayload.category = body.category;
    if (body.version) updatePayload.version = body.version;
    if (body.status && !statusFromQuery) updatePayload.status = body.status;

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided for update' }, { status: 400 });
    }

    const client = supabaseAdmin ?? supabase;
    let { data, error } = await client
      .from('Policy')
      .update(updatePayload as never)
      .eq('id', params.id)
      .select()
      .single();

    if (error && error.code === '42703') {
      const legacyPayload: Record<string, unknown> = { ...updatePayload };
      if ('fullText' in legacyPayload) {
        legacyPayload.full_text = legacyPayload.fullText;
        delete legacyPayload.fullText;
      }

      ({ data, error } = await client
        .from('Policy')
        .update(legacyPayload as never)
        .eq('id', params.id)
        .select()
        .single());
    }

    if (error || !data) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
    }

    const [policy] = await enrichWithFeedbackCounts([data as PolicyRecord]);
    return NextResponse.json(mapPolicyResponse(policy));
  } catch (error) {
    console.error('Policy update error:', error);
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
  }
}

/* Helper imported from utils */
