'use client';

import { type Feedback } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { formatDate, getSentimentColor, getSentimentBadgeColor } from '@/lib/utils';
import { AlertCircle, TrendingUp, Scale } from 'lucide-react';

interface FeedbackCardProps {
  feedback: Feedback;
}

export default function FeedbackCard({ feedback }: FeedbackCardProps) {
  const sentimentColorClass = getSentimentColor(feedback.sentiment);
  const badgeColor = getSentimentBadgeColor(feedback.sentiment);

  return (
    <Card className={`${sentimentColorClass} border-l-4 transition-all hover:shadow-md`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badgeColor} text-white`}>
              {feedback.sentiment}
            </span>
            <span className="text-xs text-muted-foreground">{feedback.language}</span>
            {feedback.isSpam && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                ⚠ Spam
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(feedback.createdAt)}</span>
        </div>

        <p className="text-sm mb-3 leading-relaxed">{feedback.text}</p>

        {/* Nuances */}
        {feedback.nuances.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {feedback.nuances.map((nuance, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium"
              >
                {nuance}
              </span>
            ))}
          </div>
        )}

        {/* Edge Case Flags */}
        {feedback.edgeCaseFlags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {feedback.edgeCaseFlags.map((flag, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs"
              >
                🔍 {flag}
              </span>
            ))}
          </div>
        )}

        {/* Summary */}
        {feedback.summary && (
          <div className="text-xs text-muted-foreground italic mb-3 pl-3 border-l-2 border-gray-300">
            {feedback.summary}
          </div>
        )}

        {/* Predictive Scores */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="flex items-center gap-1 text-xs">
            <AlertCircle className="h-3 w-3 text-red-500" />
            <span className="text-muted-foreground">Legal:</span>
            <span className="font-semibold">{feedback.legalRiskScore}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <Scale className="h-3 w-3 text-orange-500" />
            <span className="text-muted-foreground">Compliance:</span>
            <span className="font-semibold">{feedback.complianceDifficultyScore}</span>
          </div>
          <div className="flex items-center gap-1 text-xs">
            <TrendingUp className="h-3 w-3 text-green-500" />
            <span className="text-muted-foreground">Growth:</span>
            <span className="font-semibold">{feedback.businessGrowthScore}</span>
          </div>
        </div>

        {/* Optional Metadata */}
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          {feedback.stakeholderType && <span>👤 {feedback.stakeholderType}</span>}
          {feedback.sector && <span>🏢 {feedback.sector}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
