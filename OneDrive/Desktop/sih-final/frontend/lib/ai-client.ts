/**
 * Unified AI Client - Uses Google Gemini (1M tokens/day free) with Groq fallback
 * Automatically switches between providers based on availability
 */

import { GoogleGenAI } from "@google/genai";

// Initialize clients
const gemini = process.env.GOOGLE_API_KEY 
  ? new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY })
  : null;

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Prefer Gemini if available, fallback to Groq
const preferredProvider = gemini ? 'gemini' : 'groq';

/**
 * Universal AI call - works with both Gemini and Groq
 */
export async function callAI(
  prompt: string,
  modelPreference: 'gemini' | 'groq' | 'auto' = 'auto',
  maxTokens: number = 1000
): Promise<string> {
  const provider = modelPreference === 'auto' ? preferredProvider : modelPreference;

  try {
    if (provider === 'gemini' && gemini) {
      return await callGeminiAPI(prompt, maxTokens);
    } else if (GROQ_API_KEY) {
      return await callGroqAPI(prompt, 'llama-3.3-70b-versatile', maxTokens);
    } else {
      throw new Error('No AI provider configured');
    }
  } catch (error) {
    // If primary fails, try fallback
    if (provider === 'gemini' && GROQ_API_KEY) {
      console.log('Gemini failed, falling back to Groq');
      return await callGroqAPI(prompt, 'llama-3.3-70b-versatile', maxTokens);
    } else if (provider === 'groq' && gemini) {
      console.log('Groq failed, falling back to Gemini');
      return await callGeminiAPI(prompt, maxTokens);
    }
    throw error;
  }
}

/**
 * Google Gemini API call
 */
async function callGeminiAPI(prompt: string, maxTokens: number = 1000): Promise<string> {
  if (!gemini) {
    throw new Error('Google Gemini API key not configured');
  }

  try {
    const response = await gemini.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        maxOutputTokens: maxTokens,
        temperature: 0.7,
      }
    });
    
    return response.text || '';
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Groq API call (legacy fallback)
 */
async function callGroqAPI(prompt: string, model: string, maxTokens: number = 1000): Promise<string> {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key not configured');
  }

  try {
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Groq API error: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error);
    throw error;
  }
}

/**
 * Analyze sentiment using AI
 */
export async function analyzeSentiment(text: string): Promise<{
  label: string;
  score: number;
  reasoning: string;
}> {
  const prompt = `Analyze the sentiment of this text and respond with ONLY a JSON object:

Text: "${text}"

Return format:
{
  "label": "Positive" or "Negative" or "Neutral",
  "score": 0.0 to 1.0,
  "reasoning": "brief explanation"
}`;

  const response = await callAI(prompt, 'auto', 200);
  
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse sentiment response:', e);
  }

  return {
    label: 'Neutral',
    score: 0.5,
    reasoning: 'Could not determine sentiment'
  };
}

/**
 * Generate embeddings (simple hash-based for now, as Gemini doesn't have embedding endpoint yet)
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // For now, use a simple deterministic hash-based embedding
  // In production, you might want to use a dedicated embedding service
  return texts.map(text => {
    const embedding = new Array(384).fill(0);
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      embedding[i % 384] += charCode / 1000;
    }
    return embedding;
  });
}

/**
 * Cluster feedback using AI
 */
export async function clusterFeedback(
  feedbacks: Array<{ content?: string; text?: string }>,
  numClusters: number = 5
): Promise<{ clusters: Array<{ id: number; name: string; description: string; feedback_indices: number[]; key_themes: string[] }> }> {
  if (feedbacks.length < numClusters) {
    numClusters = Math.max(1, feedbacks.length);
  }

  const texts = feedbacks.map(f => f.content || f.text || String(f));

  const prompt = `Group these ${texts.length} feedback texts into ${numClusters} thematic clusters.

Feedback: ${JSON.stringify(texts.slice(0, 20))}

Return ONLY this JSON format:
{
  "clusters": [
    {
      "id": 0,
      "name": "Theme Name",
      "description": "What this cluster represents",
      "feedback_indices": [0, 1, 2],
      "key_themes": ["theme1", "theme2"]
    }
  ]
}

Ensure all indices 0-${texts.length - 1} are assigned to exactly one cluster.`;

  try {
    const response = await callAI(prompt, 'auto', 1000);
    
    const jsonMatch = response.match(/\{.*\}/s);
    if (jsonMatch) {
      const clusterData = JSON.parse(jsonMatch[0]);
      
      // Validate all feedbacks are assigned
      const assigned = new Set<number>();
      for (const cluster of clusterData.clusters || []) {
        for (const index of cluster.feedback_indices || []) {
          assigned.add(index);
        }
      }
      
      if (assigned.size === feedbacks.length) {
        return clusterData;
      }
    }
  } catch (error) {
    console.error('Clustering failed:', error);
  }

  // Fallback: even distribution
  const clusterSize = Math.floor(feedbacks.length / numClusters);
  const clusters = [];
  
  for (let i = 0; i < numClusters; i++) {
    const start = i * clusterSize;
    const end = i === numClusters - 1 ? feedbacks.length : start + clusterSize;
    
    clusters.push({
      id: i,
      name: `Group ${i + 1}`,
      description: `Feedback cluster ${i + 1}`,
      feedback_indices: Array.from({ length: end - start }, (_, idx) => start + idx),
      key_themes: ['general'],
    });
  }

  return { clusters };
}

/**
 * Generate word cloud data
 */
export async function generateWordCloudData(texts: string[]): Promise<Record<string, number>> {
  if (texts.length === 0) return {};

  const prompt = `Extract the most important keywords from these texts and their frequencies:

Texts: ${JSON.stringify(texts.slice(0, 50))}

Return ONLY a JSON object like:
{
  "keyword1": 15,
  "keyword2": 12,
  "keyword3": 8
}

Include 20-30 most relevant keywords.`;

  try {
    const response = await callAI(prompt, 'auto', 500);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Word cloud generation failed:', error);
  }

  // Fallback: simple word frequency
  const words: Record<string, number> = {};
  const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by']);
  
  texts.forEach(text => {
    const textWords = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    textWords.forEach(word => {
      if (!stopWords.has(word)) {
        words[word] = (words[word] || 0) + 1;
      }
    });
  });

  return words;
}

/**
 * Summarize feedback texts
 */
export async function summarizeFeedback(texts: string[]): Promise<string> {
  if (texts.length === 0) return 'No feedback to summarize.';

  const prompt = `Summarize the key points from these feedback texts in 2-3 concise paragraphs:

${texts.slice(0, 20).join('\n\n')}

Summary:`;

  try {
    return await callAI(prompt, 'auto', 300);
  } catch (error) {
    console.error('Summarization failed:', error);
    return 'Unable to generate summary at this time.';
  }
}

/**
 * Generate narrative from clusters
 */
export async function generateNarrativeFromClusters(
  clusters: Array<{ name: string; description: string }>,
  totalFeedback: number
): Promise<string> {
  if (!clusters.length) {
    return 'No clusters available to describe the debate landscape yet. Collect more feedback to generate insights.';
  }

  const prompt = `You are an AI policy analyst. Craft a narrative summary of the current debate landscape based on the following clusters.
Reference the overall tone, areas of agreement, and emerging tensions.
Output 2 concise paragraphs.

Total feedback: ${totalFeedback}
Clusters: ${JSON.stringify(clusters)}`;

  try {
    const response = await callAI(prompt, 'auto', 400);
    return response.trim();
  } catch (error) {
    console.error('Narrative generation failed:', error);
    return 'The feedback landscape shows diverse perspectives across multiple themes.';
  }
}

// Export helper functions for specific use cases
export { callGeminiAPI, callGroqAPI };
