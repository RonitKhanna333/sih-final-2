"use client";

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { MessageCircle, ThumbsUp, ThumbsDown, Minus, BadgeCheck, Languages } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Stat Card Component
function StatCard({ title, value, change, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {change && (
              <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const [stakeholder, setStakeholder] = useState('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // Redirect to new dashboard
  useEffect(() => {
    router.push('/admin/dashboard-new');
  }, [router]);

  // Fetch feedback data
  const { data: feedbackResponse, isLoading } = useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/feedback/`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 }
      });
      return response.data;
    }
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/feedback/analytics/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  // Extract feedback array from response
  const feedbackData = feedbackResponse?.data || [];

  // Calculate stats
  const totalComments = feedbackData?.length || 0;
  const positiveCount = feedbackData?.filter((f: any) => f.sentiment === 'Positive').length || 0;
  const negativeCount = feedbackData?.filter((f: any) => f.sentiment === 'Negative').length || 0;
  const neutralCount = feedbackData?.filter((f: any) => f.sentiment === 'Neutral').length || 0;
  const spamFiltered = feedbackData?.filter((f: any) => f.isSpam).length || 0;

  // Languages detected
  const languages = new Set(feedbackData?.map((f: any) => f.language) || []);

  // Sentiment distribution data for chart
  const sentimentData = [
    { name: 'Positive', value: positiveCount, color: '#10b981' },
    { name: 'Negative', value: negativeCount, color: '#ef4444' },
    { name: 'Neutral', value: neutralCount, color: '#f59e0b' }
  ];

  // Quality score calculation
  const qualityScore = totalComments > 0 
    ? Math.round(((totalComments - spamFiltered) / totalComments) * 100) 
    : 0;

  const analyzeSingleComment = async () => {
    if (!commentText.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/v1/feedback/`,
        {
          text: commentText,
          language: 'English',
          stakeholderType: stakeholder || undefined
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAnalysisResult(response.data);
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Sentiment Analysis Dashboard</h2>
        <p className="text-gray-600 mt-1">Monitor and analyze stakeholder feedback</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Total Comments"
          value={totalComments}
          change={12}
          icon={MessageCircle}
          color="bg-blue-500"
        />
        <StatCard
          title="Positive"
          value={positiveCount}
          change={8}
          icon={ThumbsUp}
          color="bg-green-500"
        />
        <StatCard
          title="Negative"
          value={negativeCount}
          change={-5}
          icon={ThumbsDown}
          color="bg-red-500"
        />
        <StatCard
          title="Neutral"
          value={neutralCount}
          change={-2}
          icon={Minus}
          color="bg-yellow-500"
        />
        <StatCard
          title="Quality Score"
          value={`${qualityScore}%`}
          change={null}
          icon={BadgeCheck}
          color="bg-purple-500"
        />
        <div className="text-center">
          <p className="text-xs text-gray-600 mb-1">Spam filtered</p>
          <StatCard
            title="Languages"
            value={languages.size}
            change={null}
            icon={Languages}
            color="bg-indigo-500"
          />
          <p className="text-xs text-gray-600 mt-1">Detected</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Comment Analysis */}
        <div className="lg:col-span-2 space-y-6">
          {/* Comment Analysis Section */}
          <Card>
            <CardHeader>
              <CardTitle>Comment Analysis</CardTitle>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="default">
                  Analyze All Comments
                </Button>
                <Button size="sm" variant="outline">
                  + Add Sample
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <textarea
                placeholder="Enter stakeholder comment for analysis..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="w-full min-h-[120px] p-3 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Stakeholder Name"
                  value={stakeholder}
                  onChange={(e) => setStakeholder(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-md"
                />
                <select className="px-3 py-2 border rounded-md">
                  <option>General Feedback</option>
                  <option>Technical Issue</option>
                  <option>Feature Request</option>
                </select>
                <Button onClick={analyzeSingleComment} className="bg-green-500 hover:bg-green-600">
                  + Add Comment
                </Button>
              </div>

              {/* Analysis Result */}
              {analysisResult && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md">
                  <h4 className="font-semibold mb-2">Analysis Result:</h4>
                  <p><strong>Sentiment:</strong> {analysisResult.sentiment}</p>
                  <p><strong>Is Spam:</strong> {analysisResult.isSpam ? 'Yes' : 'No'}</p>
                  {analysisResult.nuances?.length > 0 && (
                    <p><strong>Nuances:</strong> {analysisResult.nuances.join(', ')}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Individual Comment Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Individual Comment Analysis</CardTitle>
              <div className="flex gap-4 mt-4">
                <select className="px-3 py-2 border rounded-md">
                  <option>All Languages</option>
                  <option>English</option>
                  <option>Hindi</option>
                </select>
                <select className="px-3 py-2 border rounded-md">
                  <option>All Quality</option>
                  <option>High Quality</option>
                  <option>Low Quality</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {feedbackData && feedbackData.length > 0 ? (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {feedbackData.slice(0, 10).map((feedback: any) => (
                    <div
                      key={feedback.id}
                      className="p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex justify-between items-start">
                        <p className="text-sm text-gray-700 flex-1">{feedback.text}</p>
                        <span
                          className={`ml-3 px-2 py-1 text-xs rounded-full whitespace-nowrap ${
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
                      <div className="mt-2 text-xs text-gray-500">
                        {feedback.language} • {new Date(feedback.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>No comments added yet. Add sample comments or enter new ones above.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Charts */}
        <div className="space-y-6">
          {/* Sentiment Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Sentiment Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {totalComments > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={sentimentData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {sentimentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-400">
                  No data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Word Cloud Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Word Cloud Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center text-gray-400">
                  <svg className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  <p className="text-sm">Word cloud will appear after analyzing comments</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
