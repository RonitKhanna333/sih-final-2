"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Minus, 
  Shield,
  Languages,
  Sparkles,
  BarChart3,
  FileText,
  TrendingUp,
  TrendingDown,
  Cloud
} from 'lucide-react';
import WordCloudCard from '@/components/WordCloudCard';
import PolicySandbox from '@/components/PolicySandbox';
import DebateMap from '@/components/DebateMap';
import DocumentGenerator from '@/components/DocumentGenerator';
import AIChatAssistant from '@/components/AIChatAssistant';
import ClusteringAnalysis from '@/components/ClusteringAnalysis';
import PolicyContext from '@/components/PolicyContext';
import { policyAPI, type Policy } from '@/lib/api';
import { exportElementToPDF } from '@/lib/pdf';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface KPIData {
  totalSubmissions: number;
  averageSubmissionsPerDay: number;
  positiveFeedback: number;
  negativeFeedback: number;
  neutralFeedback: number;
  totalLanguages: number;
  totalStakeholderTypes: number;
}

interface Feedback {
  id: string;
  feedback: string;
  sentiment: string;
  stakeholderName?: string;
  stakeholderType?: string;
  language?: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'dashboard');
  const [newComment, setNewComment] = useState('');
  const [stakeholderName, setStakeholderName] = useState('');
  const [feedbackType, setFeedbackType] = useState('General Feedback');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [qualityFilter, setQualityFilter] = useState('all');

  // Fetch active policy
  const { data: activePolicy, isLoading: policyLoading } = useQuery<Policy>({
    queryKey: ['activePolicy'],
    queryFn: () => policyAPI.getActive(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Fetch KPIs
  const { data: kpis, isLoading: kpisLoading } = useQuery<KPIData>({
    queryKey: ['kpis'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/analytics/kpis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    refetchInterval: 30000,
  });

  // Fetch feedback list
  const { data: feedbackData, refetch: refetchFeedback } = useQuery<{ data: Feedback[] }>({
    queryKey: ['feedback'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/feedback/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  });

  const feedback = feedbackData?.data || [];

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/api/v1/feedback/`,
        {
          text: newComment,
          stakeholderType: feedbackType,
          language: 'English',
          policyId: activePolicy?.id, // Add policy context
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment('');
      setStakeholderName('');
      refetchFeedback();
      alert('Comment submitted successfully!');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment. Please try again.');
    }
  };

  // Filter feedback
  const filteredFeedback = feedback.filter(item => {
    if (languageFilter !== 'all' && item.language !== languageFilter) return false;
    if (qualityFilter !== 'all') return true; // Implement quality filtering
    return true;
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleExportReport = async () => {
    try {
      await exportElementToPDF('admin-dashboard-content', 'Smart-Report.pdf');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Single Clean Navigation Header - Matches Screenshot */}
      <nav className="bg-gradient-to-r from-indigo-700 to-blue-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-14">
            {/* Left Side - Logo and Nav */}
            <div className="flex items-center space-x-6">
              {/* Logo/Title */}
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <div className="flex flex-col -space-y-1">
                  <span className="text-base font-bold leading-tight">MCA21</span>
                  <span className="text-base font-bold leading-tight">eConsultation</span>
                </div>
              </div>
              
              {/* Navigation Tabs */}
              <div className="hidden md:flex space-x-1 text-sm ml-4">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'dashboard' ? 'bg-indigo-900/50' : 'hover:bg-white/10'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => setActiveTab('analytics')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'analytics' ? 'bg-indigo-900/50' : 'hover:bg-white/10'
                  }`}
                >
                  Advanced Analytics
                </button>
                <button 
                  onClick={() => setActiveTab('ai-assistant')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'ai-assistant' ? 'bg-indigo-900/50' : 'hover:bg-white/10'
                  }`}
                >
                  AI Assistant
                </button>
                <button 
                  onClick={() => setActiveTab('theme-clusters')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'theme-clusters' ? 'bg-indigo-900/50' : 'hover:bg-white/10'
                  }`}
                >
                  Theme Clusters
                </button>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'reports' ? 'bg-indigo-900/50' : 'hover:bg-white/10'
                  }`}
                >
                  Smart Reports
                </button>
                <button 
                  onClick={() => setActiveTab('assistant-chat')}
                  className={`px-3 py-1.5 rounded transition-colors ${
                    activeTab === 'assistant-chat' ? 'bg-indigo-900/50' : 'hover:bg-white/10'
                  }`}
                >
                  Chat Assistant
                </button>
              </div>
            </div>
            
            {/* Right Side - Actions */}
            <div className="flex items-center gap-3 text-sm">
              <button onClick={handleExportReport} className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>Export Report</span>
              </button>
              <button 
                onClick={handleLogout}
                className="px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div id="admin-dashboard-content" className="space-y-6 bg-white/40 p-1 rounded-lg">
            {/* Policy Context removed as per request */}
            {policyLoading && (
              <div className="bg-white rounded-xl p-6 text-center">
                <p className="text-gray-500">Loading policy information...</p>
              </div>
            )}

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {/* Total Comments */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 text-sm font-medium">Total Comments</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.totalSubmissions || 0}
                  </p>
                  <p className="text-xs text-green-600 flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>↑ 12%</span>
                  </p>
                </div>
              </div>

              {/* Positive */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <ThumbsUp className="h-5 w-5 text-green-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 text-sm font-medium">Positive</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.positiveFeedback || 0}
                  </p>
                  <p className="text-xs text-green-600 flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>↑ 8%</span>
                  </p>
                </div>
              </div>

              {/* Negative */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <ThumbsDown className="h-5 w-5 text-red-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 text-sm font-medium">Negative</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.negativeFeedback || 0}
                  </p>
                  <p className="text-xs text-red-600 flex items-center space-x-1">
                    <TrendingDown className="h-3 w-3" />
                    <span>↓ 5%</span>
                  </p>
                </div>
              </div>

              {/* Neutral */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-yellow-100 p-2 rounded-lg">
                    <Minus className="h-5 w-5 text-yellow-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 text-sm font-medium">Neutral</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.neutralFeedback || 0}
                  </p>
                  <p className="text-xs text-yellow-600 flex items-center space-x-1">
                    <Minus className="h-3 w-3" />
                    <span>→ 2%</span>
                  </p>
                </div>
              </div>

              {/* Quality Score */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Shield className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 text-sm font-medium">Quality Score</p>
                  <p className="text-3xl font-bold text-gray-900">0%</p>
                  <p className="text-xs text-gray-500">Spam filtered</p>
                </div>
              </div>

              {/* Languages */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="bg-indigo-100 p-2 rounded-lg">
                    <Languages className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-600 text-sm font-medium">Languages</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.totalLanguages || 0}
                  </p>
                  <p className="text-xs text-gray-500">Detected</p>
                </div>
              </div>
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Comment Analysis */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Comment Analysis</h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleAddComment}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center space-x-2"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Analyze All Comments</span>
                    </button>
                    <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                      + Add Sample
                    </button>
                  </div>
                </div>

                {/* Input Area */}
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Enter stakeholder comment for analysis..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />

                {/* Form Fields */}
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <input
                    type="text"
                    value={stakeholderName}
                    onChange={(e) => setStakeholderName(e.target.value)}
                    placeholder="Stakeholder Name"
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <select 
                    value={feedbackType}
                    onChange={(e) => setFeedbackType(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option>General Feedback</option>
                    <option>Business Owner</option>
                    <option>Citizen</option>
                    <option>Government Official</option>
                    <option>Legal Expert</option>
                  </select>
                </div>

                <button
                  onClick={handleAddComment}
                  className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  + Add Comment
                </button>

                {/* Individual Comment Analysis */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Individual Comment Analysis</h3>
                    <div className="flex space-x-2">
                      <select 
                        value={languageFilter}
                        onChange={(e) => setLanguageFilter(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="all">All Languages</option>
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                      <select 
                        value={qualityFilter}
                        onChange={(e) => setQualityFilter(e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
                      >
                        <option value="all">All Quality</option>
                        <option value="high">High Quality</option>
                      </select>
                    </div>
                  </div>

                  {filteredFeedback.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No comments added yet. Add sample comments or enter new ones above.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {filteredFeedback.slice(0, 10).map((item) => (
                        <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900 mb-2">{item.feedback}</p>
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <span>{item.stakeholderName || 'Anonymous'}</span>
                                <span>•</span>
                                <span>{item.stakeholderType || 'N/A'}</span>
                                <span>•</span>
                                <span>{item.language || 'English'}</span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                              item.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {item.sentiment}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Sentiment Distribution */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Sentiment Distribution</h3>
                  <div className="space-y-4">
                    {kpis && (
                      <>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600">Positive</span>
                            <span className="text-sm font-medium text-gray-900">
                              {kpis.totalSubmissions > 0 ? ((kpis.positiveFeedback / kpis.totalSubmissions) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all"
                              style={{ width: `${kpis.totalSubmissions > 0 ? ((kpis.positiveFeedback / kpis.totalSubmissions) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600">Negative</span>
                            <span className="text-sm font-medium text-gray-900">
                              {kpis.totalSubmissions > 0 ? ((kpis.negativeFeedback / kpis.totalSubmissions) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-red-500 h-2 rounded-full transition-all"
                              style={{ width: `${kpis.totalSubmissions > 0 ? ((kpis.negativeFeedback / kpis.totalSubmissions) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-600">Neutral</span>
                            <span className="text-sm font-medium text-gray-900">
                              {kpis.totalSubmissions > 0 ? ((kpis.neutralFeedback / kpis.totalSubmissions) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all"
                              style={{ width: `${kpis.totalSubmissions > 0 ? ((kpis.neutralFeedback / kpis.totalSubmissions) * 100) : 0}%` }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Word Cloud */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Word Cloud Analysis</h3>
                  {feedback.length > 0 ? (
                    <WordCloudCard />
                  ) : (
                    <div className="text-center py-8">
                      <Cloud className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-sm">Word cloud will appear after analyzing comments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Advanced Analytics</h2>
              <p className="text-gray-600 mb-6">Deep dive into feedback patterns and trends</p>
              <WordCloudCard />
            </div>
          </div>
        )}

        {/* AI Assistant Tab (Policy Sandbox) */}
        {activeTab === 'ai-assistant' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant - Policy Sandbox</h2>
              <p className="text-gray-600 mb-6">Test policy changes and predict stakeholder reactions</p>
              <PolicySandbox />
            </div>
          </div>
        )}

        {/* Theme Clusters Tab */}
        {activeTab === 'theme-clusters' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Theme Clusters & Debate Map</h2>
              <p className="text-gray-600 mb-6">Visualize opinion clusters and identify consensus areas</p>
              <DebateMap />
              <div className="mt-8">
                <ClusteringAnalysis />
              </div>
            </div>
          </div>
        )}

        {/* Smart Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Generated Smart Reports</h2>
              <p className="text-gray-600 mb-6">Generate ministerial briefings and policy documents</p>
              <DocumentGenerator />
            </div>
          </div>
        )}

        {/* Chat Assistant Tab */}
        {activeTab === 'assistant-chat' && (
          <div className="space-y-6">
            <AIChatAssistant />
          </div>
        )}
      </div>
    </div>
  );
}
