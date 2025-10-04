"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface Feedback {
  id: string;
  text: string;
  sentiment: string;
  language: string;
  stakeholderType?: string;
  sector?: string;
  isSpam: boolean;
  createdAt: string;
  nuances: string[];
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function FeedbackDataTable() {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<string>('');
  const [languageFilter, setLanguageFilter] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editSentiment, setEditSentiment] = useState('');
  
  const queryClient = useQueryClient();
  const limit = 20;

  // Fetch feedback data
  const { data, isLoading, error } = useQuery({
    queryKey: ['feedbackTable', page, searchQuery, sentimentFilter, languageFilter],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (sentimentFilter) params.append('sentiment', sentimentFilter);
      if (languageFilter) params.append('language', languageFilter);
      
      const response = await axios.get(`${API_URL}/api/v1/feedback/?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (feedbackId: string) => {
      const token = localStorage.getItem('token');
      return axios.delete(`${API_URL}/api/v1/feedback/${feedbackId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackTable'] });
      queryClient.invalidateQueries({ queryKey: ['kpis'] });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, text, sentiment }: { id: string; text?: string; sentiment?: string }) => {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (text) params.append('text', text);
      if (sentiment) params.append('sentiment', sentiment);
      
      return axios.put(`${API_URL}/api/v1/feedback/${id}?${params}`, null, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbackTable'] });
      setEditingId(null);
    }
  });

  const handleEdit = (feedback: Feedback) => {
    setEditingId(feedback.id);
    setEditText(feedback.text);
    setEditSentiment(feedback.sentiment);
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        text: editText,
        sentiment: editSentiment
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this feedback?')) {
      deleteMutation.mutate(id);
    }
  };

  const feedbackData: Feedback[] = data?.data || [];
  const pagination: PaginationData = data?.pagination || {
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
    hasNext: false,
    hasPrev: false
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Management</CardTitle>
        <CardDescription>
          View, search, filter, edit, and moderate all feedback submissions
        </CardDescription>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page
              }}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          
          {/* Sentiment Filter */}
          <select
            value={sentimentFilter}
            onChange={(e) => {
              setSentimentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Sentiments</option>
            <option value="Positive">Positive</option>
            <option value="Negative">Negative</option>
            <option value="Neutral">Neutral</option>
          </select>
          
          {/* Language Filter */}
          <select
            value={languageFilter}
            onChange={(e) => {
              setLanguageFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Languages</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
          </select>
          
          {/* Clear Filters */}
          <Button
            variant="outline"
            onClick={() => {
              setSearchQuery('');
              setSentimentFilter('');
              setLanguageFilter('');
              setPage(1);
            }}
          >
            <Filter className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            Failed to load feedback data
          </div>
        ) : feedbackData.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No feedback found matching your filters
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Feedback</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Sentiment</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Language</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Stakeholder</th>
                    <th className="text-left p-3 text-sm font-medium text-gray-600">Date</th>
                    <th className="text-right p-3 text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feedbackData.map((feedback) => (
                    <tr key={feedback.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        {editingId === feedback.id ? (
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            rows={2}
                          />
                        ) : (
                          <div className="max-w-md">
                            <p className="text-sm text-gray-900 line-clamp-2">
                              {feedback.text}
                            </p>
                            {feedback.isSpam && (
                              <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                                Spam
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        {editingId === feedback.id ? (
                          <select
                            value={editSentiment}
                            onChange={(e) => setEditSentiment(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                          >
                            <option value="Positive">Positive</option>
                            <option value="Negative">Negative</option>
                            <option value="Neutral">Neutral</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            feedback.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                            feedback.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {feedback.sentiment}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-sm text-gray-700">{feedback.language}</td>
                      <td className="p-3 text-sm text-gray-700">{feedback.stakeholderType || '-'}</td>
                      <td className="p-3 text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-2">
                          {editingId === feedback.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={handleSaveEdit}
                                disabled={updateMutation.isPending}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(feedback)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDelete(feedback.id)}
                                disabled={deleteMutation.isPending}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                Showing {feedbackData.length} of {pagination.total} results
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page - 1)}
                  disabled={!pagination.hasPrev}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <div className="flex items-center px-3 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage(page + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
