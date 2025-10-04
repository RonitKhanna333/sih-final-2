/**
 * Utility functions for frontend
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getSentimentColor(sentiment: string): string {
  switch (sentiment) {
    case 'Positive':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'Negative':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'Neutral':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

export function getSentimentBadgeColor(sentiment: string): string {
  switch (sentiment) {
    case 'Positive':
      return 'bg-green-500';
    case 'Negative':
      return 'bg-red-500';
    case 'Neutral':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
}
