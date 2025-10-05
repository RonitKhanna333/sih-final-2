import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callAI } from '@/lib/ai-client';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  sentimentFocus?: string;
  includeContext?: boolean;
  maxHistory?: number;
}

const DEFAULT_HISTORY = 10;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;
    const messages = body.messages?.slice(-(body.maxHistory ?? DEFAULT_HISTORY)) ?? [];
    const sentimentFocus = body.sentimentFocus;
    const includeContext = body.includeContext ?? true;

    const contextLines = includeContext ? await fetchFeedbackContext(sentimentFocus) : [];

    const prompt = buildPrompt(messages, contextLines, sentimentFocus);
    const reply = await callAI(prompt, 'auto', 400);

    return NextResponse.json({
      reply: reply.trim(),
      usedContext: contextLines.length,
      model: 'Google Gemini / Groq AI',
      degraded: false,
    });
  } catch (error) {
    console.error('Assistant chat error:', error);
    return NextResponse.json({
      reply: 'I ran into an issue generating a response. Please try again in a moment.',
      usedContext: 0,
      degraded: true,
    }, { status: 500 });
  }
}

type FeedbackSnippetRow = {
  text?: string | null;
  sentiment?: string | null;
  stakeholderType?: string | null;
} & Partial<{ stakeholder_type?: string | null }>;

async function fetchFeedbackContext(sentimentFocus?: string) {
  const selectColumnsCamel = 'text, sentiment, stakeholderType';
  const selectColumnsLegacy = 'text, sentiment, stakeholder_type';

  let { data, error } = await supabase
    .from('Feedback')
    .select(selectColumnsCamel)
    .order('createdAt', { ascending: false })
    .limit(25);

  if (error && error.code === '42703') {
    ({ data, error } = await supabase
      .from('Feedback')
      .select(selectColumnsLegacy)
      .order('created_at', { ascending: false })
      .limit(25));
  }

  if (error || !data) {
    console.error('Context fetch error:', error);
    return [] as string[];
  }

  const rows = data as FeedbackSnippetRow[];
  const filtered = sentimentFocus
    ? rows.filter((item) => (item.sentiment ?? '').toLowerCase() === sentimentFocus.toLowerCase())
    : rows;

  return filtered.slice(0, 15).map((item) => {
    const sentiment = item.sentiment ?? 'Neutral';
    const stakeholder = (item.stakeholderType ?? item.stakeholder_type) ?? 'General';
    return `Sentiment: ${sentiment}. Stakeholder: ${stakeholder}. Feedback: ${item.text ?? ''}`;
  });
}

function buildPrompt(messages: ChatMessage[], contextLines: string[], sentimentFocus?: string) {
  const conversation = messages
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const contextSection = contextLines.length
    ? `Recent stakeholder feedback snippets:\n${contextLines.join('\n')}`
    : 'No contextual feedback is currently available.';

  return `You are OPINIZE, an expert policy consultation assistant.
Respond concisely and kindly, grounding insights in the provided feedback when possible.
If sentiment focus is specified, prioritise perspectives that match it.

Sentiment focus: ${sentimentFocus ?? 'All'}
${contextSection}

Conversation so far:
${conversation}

Assistant:`;
}
