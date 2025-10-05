import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { enrichWithFeedbackCounts, mapPolicyResponse, type PolicyRecord } from '../utils';

export async function GET() {
  try {
    let { data, error } = await supabase
      .from('Policy')
      .select('*')
      .in('status', ['active', 'published'])
      .order('updatedAt', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code === '42703') {
      ({ data, error } = await supabase
        .from('Policy')
        .select('*')
        .in('status', ['active', 'published'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle());
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch active policy' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'No active policy found' }, { status: 404 });
    }

    const [policy] = await enrichWithFeedbackCounts([data as PolicyRecord]);
    return NextResponse.json(mapPolicyResponse(policy));
  } catch (error) {
    console.error('Active policy error:', error);
    return NextResponse.json({ error: 'Failed to fetch active policy' }, { status: 500 });
  }
}
