import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateWordCloud } from '@/lib/groq';

interface FeedbackLanguageRow {
  text?: string | null;
  language?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const policyId = url.searchParams.get('policyId');
    const language = url.searchParams.get('language');

    const buildQuery = (column: string) => {
      let query = supabase.from('Feedback').select('text, language');
      if (policyId) {
        query = query.eq(column, policyId);
      }
      return query;
    };

    let { data, error } = await buildQuery('policyId');

    if (error && error.code === '42703') {
      ({ data, error } = await buildQuery('policy_id'));
    }

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch feedback for wordcloud' }, { status: 500 });
    }

    const rows = (data ?? []) as FeedbackLanguageRow[];
    const filtered = rows.filter((row) => {
      if (!language) return true;
      return (row.language ?? '').toLowerCase() === language.toLowerCase();
    });

    const texts = filtered
      .map((fb) => fb.text)
      .filter((text): text is string => typeof text === 'string' && text.trim().length > 0);

    if (!texts.length) {
      return NextResponse.json({
        words: {},
        totalFeedback: 0,
      });
    }

    const words = await generateWordCloud(texts);
    return NextResponse.json({ words, totalFeedback: texts.length });
  } catch (error) {
    console.error('WordCloud error:', error);
    return NextResponse.json({ error: 'WordCloud failed' }, { status: 500 });
  }
}
