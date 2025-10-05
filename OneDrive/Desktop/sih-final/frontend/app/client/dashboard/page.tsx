"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import PolicyContext from '@/components/PolicyContext';
import { policyAPI, type Policy } from '@/lib/api';

// Using Next.js API routes - no external backend needed
const API_BASE = '/api';

interface FeedbackEntry {
  id: string;
  text: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  language: string;
  nuances: string[];
  isSpam: boolean;
  legalRiskScore: number;
  complianceDifficultyScore: number;
  businessGrowthScore: number;
  stakeholderType?: string;
  sector?: string;
  summary?: string;
  edgeCaseFlags: string[];
  policyId?: string;
  sentimentConfidence?: number;
  reasoning?: string;
  createdAt: string;
  updatedAt?: string;
  legalReference?: string | { case: string };
}

interface FeedbackListResponse {
  data: FeedbackEntry[];
}

interface SubmitFeedbackPayload {
  text: string;
  language: string;
  stakeholderType?: string;
  sector?: string;
  policyId?: string;
}

export default function ClientDashboard() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('English');
  const [stakeholderType, setStakeholderType] = useState('');
  const [sector, setSector] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const queryClient = useQueryClient();

  // Fetch active policy
  const { data: activePolicy, isLoading: policyLoading, error: policyError } = useQuery<Policy>({
    queryKey: ['activePolicy'],
    queryFn: () => policyAPI.getActive(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch user's submissions
  const { data: myFeedbackResponse, isLoading } = useQuery<FeedbackListResponse>({
    queryKey: ['myFeedback'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/feedback?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  // Extract feedback array from response
  const myFeedback = myFeedbackResponse?.data || [];

  // Submit feedback mutation
  const submitMutation = useMutation({
    mutationFn: async (payload: SubmitFeedbackPayload) => {
      const token = localStorage.getItem('token');
      return axios.post(`${API_BASE}/feedback`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['activePolicy'] });
      setText('');
      setStakeholderType('');
      setSector('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!text.trim()) return;

    submitMutation.mutate({
      text,
      language,
      stakeholderType: stakeholderType || undefined,
      sector: sector || undefined,
      policyId: activePolicy?.id // Include policy context for AI
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-indigo-600 mb-2">OPINIZE</h1>
        <p className="text-xl text-gray-600">AI-Powered eConsultation Analytics Platform</p>
        <p className="text-gray-500 mt-2">Multilingual sentiment analysis, nuance detection, and policy insights</p>
      </div>

      {/* Policy Context - Show what users are commenting on */}
      {policyLoading && (
        <div className="mb-6 bg-white rounded-xl p-6 text-center border border-gray-200">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-indigo-600" />
          <p className="text-gray-500 mt-2">Loading policy information...</p>
        </div>
      )}

      {policyError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">No Active Policy</h3>
              <p className="text-sm text-red-700">There is currently no active policy for consultation. Please check back later.</p>
            </div>
          </div>
        </div>
      )}

      {activePolicy && (
        <div className="mb-6">
          <PolicyContext policy={activePolicy} />
        </div>
      )}

      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Feedback Submitted Successfully!</h3>
              <p className="text-sm text-green-700">Your opinion has been recorded and will be analyzed by our AI system.</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left - Submit Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Feedback</CardTitle>
            <CardDescription>
              Share your thoughts on the proposed policy above. Your feedback will be analyzed for
              sentiment, nuances, and policy impact predictions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="English">English</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              {/* Feedback Text */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Your Feedback <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder={activePolicy 
                    ? `Share your thoughts on: ${activePolicy.title.substring(0, 60)}...`
                    : "Enter your consultation feedback here..."
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  required
                  rows={6}
                  className="resize-none"
                />
                {activePolicy && (
                  <p className="text-xs text-gray-500 flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span>Your feedback will be linked to the policy above for AI analysis</span>
                  </p>
                )}
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Stakeholder Type (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Business Owner, Consumer"
                    value={stakeholderType}
                    onChange={(e) => setStakeholderType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Sector (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Healthcare, Technology"
                    value={sector}
                    onChange={(e) => setSector(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={submitMutation.isPending || !text.trim()}
              >
                {submitMutation.isPending ? (
                  <>Analyzing...</>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </Button>

              {/* Success Message */}
              {submitMutation.isSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Feedback submitted successfully!
                </div>
              )}

              {/* Error Message */}
              {submitMutation.isError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  Failed to submit feedback. Please try again.
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Right - My Submissions */}
        <Card>
          <CardHeader>
            <CardTitle>My Submissions</CardTitle>
            <CardDescription>
              View your feedback submissions and their analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : myFeedback && myFeedback.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {myFeedback.map((feedback) => (
                  <div
                    key={feedback.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {/* Feedback Text */}
                    <p className="text-sm text-gray-700 mb-3">{feedback.text}</p>

                    {/* Analysis Results */}
                    <div className="space-y-2">
                      {/* Sentiment */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">Sentiment:</span>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            feedback.sentiment === 'Positive'
                              ? 'bg-green-100 text-green-700'
                              : feedback.sentiment === 'Negative'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {feedback.sentiment}
                        </span>
                      </div>

                      {/* Nuances */}
                      {feedback.nuances && feedback.nuances.length > 0 && (
                        <div>
                          <span className="text-xs text-gray-600">Nuances: </span>
                          <span className="text-xs text-gray-800">
                            {feedback.nuances.join(', ')}
                          </span>
                        </div>
                      )}

                      {/* Spam Status */}
                      {feedback.isSpam && (
                        <div className="text-xs text-red-600">
                          ⚠️ Flagged as potential spam
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-gray-500 mt-2">
                        {new Date(feedback.createdAt).toLocaleString()}
                      </div>

                      {/* Legal Reference */}
                      {feedback.legalReference && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-start space-x-2">
                            <FileText className="h-4 w-4 text-indigo-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-indigo-600">
                                Legal Reference Found
                              </p>
                              <p className="text-xs text-gray-600 mt-1">
                                {typeof feedback.legalReference === 'string'
                                  ? JSON.parse(feedback.legalReference).case
                                  : feedback.legalReference.case}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>No submissions yet</p>
                <p className="text-sm mt-2">Submit your first feedback to get started</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
