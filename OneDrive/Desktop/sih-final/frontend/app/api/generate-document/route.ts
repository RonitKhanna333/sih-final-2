import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { callAI } from '@/lib/ai-client';

interface GenerateDocumentRequest {
  documentType: 'briefing' | 'response' | 'risk_assessment';
  topic: string;
  sentimentFilter?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateDocumentRequest = await request.json();
    const { documentType, topic, sentimentFilter } = body;

    if (!topic || !documentType) {
      return NextResponse.json(
        { error: 'Topic and document type are required' },
        { status: 400 }
      );
    }

    // Fetch feedback data based on filters
    let query = supabase
      .from('Feedback')
      .select('text, sentiment, stakeholderType, createdAt');

    // Apply sentiment filter if specified
    if (sentimentFilter && sentimentFilter !== 'all') {
      query = query.eq('sentiment', sentimentFilter);
    }

    const { data: feedbackData, error } = await query.limit(50);

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch feedback data' },
        { status: 500 }
      );
    }

    if (!feedbackData || feedbackData.length < 5) {
      return NextResponse.json(
        { error: 'Insufficient feedback data. At least 5 feedback entries required.' },
        { status: 400 }
      );
    }

    // Prepare feedback texts
    const feedbackTexts = feedbackData
      .map((fb: Record<string, unknown>) => fb.text)
      .filter((text: unknown): text is string => typeof text === 'string' && text.trim().length > 0);

    // Generate document using AI
    const document = await generateDocumentWithAI(
      documentType,
      topic,
      feedbackTexts,
      feedbackData.length
    );

    return NextResponse.json(document);
  } catch (error) {
    console.error('Document generation error:', error);
    return NextResponse.json(
      { detail: 'Failed to generate document. Ensure sufficient relevant feedback exists.' },
      { status: 500 }
    );
  }
}

async function generateDocumentWithAI(
  documentType: string,
  topic: string,
  feedbackTexts: string[],
  totalFeedback: number
) {
  const feedbackSample = feedbackTexts.slice(0, 20).join('\n- ');

  let prompt = '';
  let title = '';

  switch (documentType) {
    case 'briefing':
      title = `Ministerial Briefing: ${topic}`;
      prompt = `Generate a comprehensive ministerial briefing document about "${topic}" based on public feedback.

Public Feedback Sample:
- ${feedbackSample}

Return a JSON object with this exact structure:
{
  "documentType": "briefing",
  "title": "${title}",
  "sections": [
    {
      "title": "Executive Summary",
      "content": "2-3 paragraph overview"
    },
    {
      "title": "Key Public Concerns",
      "content": "Bullet points of main concerns"
    },
    {
      "title": "Sentiment Analysis",
      "content": "Overall public sentiment analysis"
    },
    {
      "title": "Recommendations",
      "content": "3-5 actionable recommendations"
    }
  ],
  "metadata": {
    "totalFeedbackAnalyzed": ${totalFeedback},
    "dateGenerated": "${new Date().toISOString()}",
    "topicRelevanceThreshold": 0.7
  }
}`;
      break;

    case 'response':
      title = `Public Response Document: ${topic}`;
      prompt = `Generate a public response document addressing concerns about "${topic}".

Public Feedback Sample:
- ${feedbackSample}

Return a JSON object with this exact structure:
{
  "documentType": "response",
  "title": "${title}",
  "sections": [
    {
      "title": "Acknowledgment",
      "content": "Acknowledge public concerns"
    },
    {
      "title": "Our Position",
      "content": "Government's position on the matter"
    },
    {
      "title": "Addressing Key Concerns",
      "content": "Point-by-point response to main concerns"
    },
    {
      "title": "Next Steps",
      "content": "What happens next"
    }
  ],
  "metadata": {
    "totalFeedbackAnalyzed": ${totalFeedback},
    "dateGenerated": "${new Date().toISOString()}",
    "topicRelevanceThreshold": 0.7
  }
}`;
      break;

    case 'risk_assessment':
      title = `Risk Assessment: ${topic}`;
      prompt = `Generate a risk assessment document for "${topic}" based on public feedback.

Public Feedback Sample:
- ${feedbackSample}

Return a JSON object with this exact structure:
{
  "documentType": "risk_assessment",
  "title": "${title}",
  "sections": [
    {
      "title": "Risk Overview",
      "content": "Summary of identified risks"
    },
    {
      "title": "Critical Risks",
      "content": "High-priority risks requiring immediate attention"
    },
    {
      "title": "Moderate Risks",
      "content": "Medium-priority risks"
    },
    {
      "title": "Mitigation Strategies",
      "content": "Recommended mitigation approaches"
    }
  ],
  "metadata": {
    "totalFeedbackAnalyzed": ${totalFeedback},
    "dateGenerated": "${new Date().toISOString()}",
    "topicRelevanceThreshold": 0.7
  }
}`;
      break;

    default:
      throw new Error('Invalid document type');
  }

  try {
    const response = await callAI(prompt, 'auto', 2000);
    
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parsing fails
    return {
      documentType,
      title,
      sections: [
        {
          title: 'Analysis',
          content: response,
        },
      ],
      metadata: {
        totalFeedbackAnalyzed: totalFeedback,
        dateGenerated: new Date().toISOString(),
        topicRelevanceThreshold: 0.7,
      },
    };
  } catch (error) {
    console.error('AI generation error:', error);
    throw error;
  }
}
