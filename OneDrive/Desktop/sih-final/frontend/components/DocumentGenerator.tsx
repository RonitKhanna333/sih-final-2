"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Download, Sparkles, AlertCircle } from 'lucide-react';
import { exportGeneratedDocumentToPDF, type GeneratedDocumentLike } from '@/lib/pdf';

// Using Next.js API routes - no external backend needed
const API_BASE = '/api';

interface DocumentSection {
  title: string;
  content: string;
}

interface GeneratedDocument {
  documentType: string;
  title: string;
  sections: DocumentSection[];
  metadata: {
    totalFeedbackAnalyzed: number;
    dateGenerated: string;
    topicRelevanceThreshold: number;
  };
}

interface GenerateRequest {
  documentType: 'briefing' | 'response' | 'risk_assessment';
  topic: string;
  sentimentFilter?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

export default function DocumentGenerator() {
  const [documentType, setDocumentType] = useState<'briefing' | 'response' | 'risk_assessment'>('briefing');
  const [topic, setTopic] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('all');

  const generateMutation = useMutation<
    GeneratedDocument,
    AxiosError<{ detail?: string }>,
    GenerateRequest
  >({
    mutationFn: async (request: GenerateRequest) => {
      const token = localStorage.getItem('token');
      const response = await axios.post<GeneratedDocument>(
        `${API_BASE}/generate-document`,
        request,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
  });

  const handleGenerate = () => {
    if (!topic.trim()) {
      alert('Please enter a topic or policy area');
      return;
    }

    const request: GenerateRequest = {
      documentType,
      topic: topic.trim(),
    };

    if (sentimentFilter !== 'all') {
      request.sentimentFilter = sentimentFilter;
    }

    generateMutation.mutate(request);
  };

  const handleDownload = () => {
    if (!generateMutation.data) return;

    const doc = generateMutation.data;
    let markdown = `# ${doc.title}\n\n`;
    markdown += `**Document Type:** ${doc.documentType}\n`;
    markdown += `**Generated:** ${new Date(doc.metadata.dateGenerated).toLocaleString()}\n`;
    markdown += `**Feedback Analyzed:** ${doc.metadata.totalFeedbackAnalyzed} items\n\n`;
    markdown += `---\n\n`;

    doc.sections.forEach((section) => {
      markdown += `## ${section.title}\n\n${section.content}\n\n`;
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/\s+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!generateMutation.data) return;
    // Map response shape to pdf helper's expected format
    const doc = generateMutation.data;
    const mapped: GeneratedDocumentLike = {
      title: doc.title,
      documentType: doc.documentType,
      sections: (doc.sections || []).map((section) => ({
        heading: section.title,
        content: section.content,
      })),
      metadata: doc.metadata,
    };
    exportGeneratedDocumentToPDF(mapped, `${doc.title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-purple-600" />
            AI Document Generator
          </CardTitle>
          <CardDescription>
            Generate policy briefings, public responses, and risk assessments from feedback data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Document Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setDocumentType('briefing')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    documentType === 'briefing'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Ministerial Briefing</div>
                  <div className="text-xs text-gray-600">
                    Executive summary for senior officials
                  </div>
                </button>

                <button
                  onClick={() => setDocumentType('response')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    documentType === 'response'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Public Response</div>
                  <div className="text-xs text-gray-600">
                    Draft response to public feedback
                  </div>
                </button>

                <button
                  onClick={() => setDocumentType('risk_assessment')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    documentType === 'risk_assessment'
                      ? 'border-purple-500 bg-purple-50 text-purple-900'
                      : 'border-gray-200 hover:border-purple-300'
                  }`}
                >
                  <div className="font-semibold mb-1">Risk Assessment</div>
                  <div className="text-xs text-gray-600">
                    Identify potential risks and mitigation
                  </div>
                </button>
              </div>
            </div>

            {/* Topic Input */}
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                Topic or Policy Area
              </label>
              <Textarea
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Digital India Initiative, healthcare reform, data privacy regulations"
                className="min-h-[80px]"
              />
            </div>

            {/* Sentiment Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Sentiment (Optional)
              </label>
              <div className="flex gap-2">
                {['all', 'Positive', 'Neutral', 'Negative'].map((sentiment) => (
                  <button
                    key={sentiment}
                    onClick={() => setSentimentFilter(sentiment)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                      sentimentFilter === sentiment
                        ? 'border-purple-500 bg-purple-50 text-purple-900'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    {sentiment === 'all' ? 'All Sentiments' : sentiment}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={generateMutation.isPending || !topic.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              {generateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Generating Document...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate AI Document
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {generateMutation.isError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-900">Generation Failed</p>
                <p className="text-sm text-red-700 mt-1">
                  {generateMutation.error?.response?.data?.detail ||
                    'Failed to generate document. Ensure sufficient relevant feedback exists.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Document Display */}
      {generateMutation.isSuccess && generateMutation.data && (
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-purple-900">
                  {generateMutation.data.title}
                </CardTitle>
                <CardDescription className="mt-2">
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span>
                      <strong>Type:</strong>{' '}
                      {generateMutation.data.documentType.replace('_', ' ').toUpperCase()}
                    </span>
                    <span>
                      <strong>Generated:</strong>{' '}
                      {new Date(generateMutation.data.metadata.dateGenerated).toLocaleString()}
                    </span>
                    <span>
                      <strong>Analyzed:</strong>{' '}
                      {generateMutation.data.metadata.totalFeedbackAnalyzed} feedback items
                    </span>
                  </div>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download MD
                </Button>
                <Button size="sm" variant="default" onClick={handleDownloadPDF}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {generateMutation.data.sections.map((section, index) => (
                <div key={index} className="border-l-4 border-purple-500 pl-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h3>
                  <div className="prose prose-sm max-w-none text-gray-700">
                    {section.content.split('\n\n').map((paragraph, pIndex) => (
                      <p key={pIndex} className="mb-3 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Helper Info */}
      {!generateMutation.data && !generateMutation.isPending && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 mb-2">AI Document Generation Tips:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • <strong>Be specific:</strong> Use focused topics for better results (e.g., “5G rollout in
                    rural areas” vs. “telecom policy”)
                  </li>
                  <li>
                    • <strong>Briefings:</strong> Best for executive summaries with stakeholder positions and
                    recommendations
                  </li>
                  <li>
                    • <strong>Public Responses:</strong> Draft acknowledgment and government position on feedback
                  </li>
                  <li>
                    • <strong>Risk Assessments:</strong> Identify political, operational, and reputational risks
                  </li>
                  <li>
                    • <strong>Sentiment filter:</strong> Focus on specific stakeholder reactions (e.g., only
                    negative feedback for risk assessment)
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
