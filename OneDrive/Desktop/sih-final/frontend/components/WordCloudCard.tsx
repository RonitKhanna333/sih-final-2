"use client";

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Cloud } from 'lucide-react';
import axios from 'axios';

// Using Next.js API routes - no external backend needed
const API_BASE = '/api';

interface WordCloudData {
  words: Record<string, number>;
  totalFeedback: number;
}

export default function WordCloudCard() {
  const { data, isLoading, refetch } = useQuery<WordCloudData>({
    queryKey: ['wordcloud'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/wordcloud`);
      return response.data;
    },
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    refetch();
  };

  // Convert words object to array and sort by frequency
  const wordArray = data?.words ? Object.entries(data.words)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 30) // Top 30 words
    : [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Word Cloud</CardTitle>
            <CardDescription>
              Most frequent words from feedback submissions
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Generating word cloud...</p>
            </div>
          </div>
        ) : wordArray.length === 0 ? (
          <div className="w-full h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center text-gray-400">
              <Cloud className="h-16 w-16 mx-auto mb-4" />
              <p className="text-lg font-medium">No feedback data yet</p>
              <p className="text-sm">Add feedback to generate word cloud</p>
            </div>
          </div>
        ) : (
          <div className="w-full min-h-[400px] bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-8 flex flex-wrap items-center justify-center gap-4">
            {wordArray.map((word, index) => {
              // Calculate font size based on frequency (larger = more frequent)
              const maxValue = wordArray[0]?.value || 1;
              const minValue = wordArray[wordArray.length - 1]?.value || 1;
              const range = maxValue - minValue || 1;
              const normalizedValue = (word.value - minValue) / range;
              const fontSize = 12 + normalizedValue * 48; // 12px to 60px
              
              // Rotate some words for visual interest
              const rotation = index % 3 === 0 ? -15 : index % 3 === 1 ? 15 : 0;
              
              // Color variations
              const colors = [
                'text-indigo-600',
                'text-purple-600', 
                'text-blue-600',
                'text-violet-600',
                'text-fuchsia-600'
              ];
              const color = colors[index % colors.length];
              
              return (
                <span
                  key={word.text}
                  className={`font-bold ${color} transition-all hover:scale-110 cursor-pointer`}
                  style={{
                    fontSize: `${fontSize}px`,
                    transform: `rotate(${rotation}deg)`,
                    opacity: 0.7 + normalizedValue * 0.3,
                  }}
                  title={`${word.text}: ${word.value} occurrences`}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3 text-center">
          {data?.totalFeedback 
            ? `Generated from ${data.totalFeedback} feedback submissions` 
            : 'Generated from all English feedback submissions'
          }
        </p>
      </CardContent>
    </Card>
  );
}
