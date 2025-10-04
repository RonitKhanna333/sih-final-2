'use client';

import { useQuery } from '@tanstack/react-query';
import { feedbackAPI, type Feedback, type FeedbackListResponse } from '@/lib/api';
import FeedbackCard from './FeedbackCard';
import { Loader2 } from 'lucide-react';

export default function FeedbackList() {
  const { data: feedbackResponse, isLoading, error } = useQuery<FeedbackListResponse>({
    queryKey: ['feedback'],
    queryFn: () => feedbackAPI.getAll(100, 0),
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  const feedbacks = feedbackResponse?.data || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
        Failed to load feedback. Please try refreshing the page.
      </div>
    );
  }

  if (!feedbacks || feedbacks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No feedback submitted yet. Be the first to share your thoughts!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          All Feedback <span className="text-muted-foreground text-lg">({feedbacks.length})</span>
        </h2>
      </div>
      
      <div className="space-y-3">
        {feedbacks.map((feedback) => (
          <FeedbackCard key={feedback.id} feedback={feedback} />
        ))}
      </div>
    </div>
  );
}
