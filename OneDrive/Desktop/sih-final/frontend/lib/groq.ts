import {
  callAI as callGroqAPI,
  analyzeSentiment,
  clusterFeedback as clusterFeedbackRaw,
  generateEmbeddings,
  generateWordCloudData,
  summarizeFeedback as summarizeFeedbackRaw,
} from '@/lib/ai-client';

// Helper functions (non-AI, simple JavaScript logic)
function detectLanguage(text: string): string {
  for (const char of text) {
    if (char >= '\u0900' && char <= '\u097F') return "Hindi";
  }
  return "English";
}

function detectSpam(text: string): boolean {
  const t = text.toLowerCase();
  if (t.length < 3) return true;
  const spamPatterns = ["http://", "https://", "buy now", "free $$$", "click here", "www."];
  if (spamPatterns.some(p => t.includes(p))) return true;
  if (Array.from(new Set(t)).some(ch => t.includes(ch.repeat(6)))) return true;
  if (text.length > 10) {
    const upperRatio = text.split('').filter(c => c === c.toUpperCase() && c !== c.toLowerCase()).length / text.length;
    if (upperRatio > 0.7) return true;
  }
  return false;
}

function computePredictiveScores(text: string): { legalRisk: number; complianceDifficulty: number; businessGrowth: number; } {
  const t = text.toLowerCase();
  const score = (keywords: string[]): number => {
    const count = keywords.reduce((sum, kw) => sum + (t.split(kw).length - 1), 0);
    return Math.min(100, count * 20);
  };
  return {
    legalRisk: score(["non-compliance", "penalty", "violate", "risk", "litigation", "lawsuit", "legal", "regulation", "fine"]),
    complianceDifficulty: score(["complex", "difficult", "burden", "cost", "ambiguous", "unclear", "confusing", "challenging"]),
    businessGrowth: score(["growth", "innovation", "revenue", "invest", "expand", "opportunity", "competitive", "market"])
  };
}

function detectNuances(text: string, language: string): string[] {
  const nuances: string[] = [];
  const t = text.toLowerCase();
  const sarcasmEn = ["yeah right", "sure", "as if", "great, another", "just what we needed", "oh wonderful", "obviously", "thanks a lot", "what a relief"];
  const sarcasmHi = ["बिल्कुल सही", "वाह", "बहुत बढ़िया", "क्या बात है", "मज़ाक", "क्या फायदा"];
  const sarcasmList = language === "Hindi" ? sarcasmHi : sarcasmEn;
  const checkText = language === "Hindi" ? text : t;
  if (sarcasmList.some(k => checkText.includes(k))) nuances.push("Sarcasm");
  if ((t.includes("but") && (t.includes("good") || t.includes("improve"))) || (text.includes("लेकिन") && text.includes("अच्छा"))) nuances.push("Mixed Sentiment");
  if (["respectfully", "with due respect", "may not", "might not"].some(p => t.includes(p)) || ["सादर", "आदरपूर्वक"].some(p => text.includes(p))) nuances.push("Polite Disagreement");
  if (text.trim().split(" ").length < 5) nuances.push("Short/Ambiguous");
  return nuances;
}

export interface FeedbackAnalysis {
  sentiment: string;
  confidence: number;
  reasoning: string;
  language: string;
  isSpam: boolean;
  nuances: string[];
  scores: {
    legalRisk: number;
    complianceDifficulty: number;
    businessGrowth: number;
  };
  embedding?: number[];
}

export async function getGroqEmbedding(text: string): Promise<number[] | undefined> {
  const embeddings = await generateEmbeddings([text]);
  return embeddings[0];
}

export async function analyzeFeedbackGroq(text: string): Promise<FeedbackAnalysis> {
  const language = detectLanguage(text);
  const isSpam = detectSpam(text);
  const nuances = detectNuances(text, language);
  const sentimentResult = await analyzeSentiment(text);
  const scores = computePredictiveScores(text);
  
  // Try to get embeddings, but don't fail if it errors
  let embedding: number[] | undefined;
  try {
    embedding = await getGroqEmbedding(text);
  } catch (error) {
    console.log('Embedding generation skipped:', error instanceof Error ? error.message : 'Unknown error');
    embedding = undefined;
  }

  return {
    sentiment: normalizeSentiment(sentimentResult.label),
    confidence: sentimentResult.score,
    reasoning: sentimentResult.reasoning,
    language,
    isSpam,
    nuances,
    scores: {
      legalRisk: scores.legalRisk,
      complianceDifficulty: scores.complianceDifficulty,
      businessGrowth: scores.businessGrowth,
    },
    embedding,
  };
}

export async function summarizeFeedback(texts: string[]): Promise<string> {
  return summarizeFeedbackRaw(texts);
}

export async function clusterFeedback(texts: Array<{ text?: string; content?: string }>, numClusters = 5) {
  return clusterFeedbackRaw(texts, numClusters);
}

export async function generateWordCloud(texts: string[]) {
  return generateWordCloudData(texts);
}

export async function getGroqEmbeddings(texts: string[]) {
  if (!texts.length) return [] as number[][];
  return generateEmbeddings(texts);
}

export async function generateNarrativeFromClusters(clusters: Array<{ name: string; description: string }>, totalFeedback: number): Promise<string> {
  if (!clusters.length) {
    return 'No clusters available to describe the debate landscape yet. Collect more feedback to generate insights.';
  }

  const prompt = `
You are an AI policy analyst. Craft a narrative summary of the current debate landscape based on the following clusters.
Reference the overall tone, areas of agreement, and emerging tensions.
Output 2 concise paragraphs.

Total feedback: ${totalFeedback}
Clusters: ${JSON.stringify(clusters)}
`;

  const response = await callGroqAPI(prompt, 'auto', 400);
  return response.trim();
}

function normalizeSentiment(label: string): 'Positive' | 'Negative' | 'Neutral' {
  const normalized = label.toLowerCase();
  if (normalized.includes('pos')) return 'Positive';
  if (normalized.includes('neg')) return 'Negative';
  return 'Neutral';
}
