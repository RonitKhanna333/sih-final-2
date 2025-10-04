'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { feedbackAPI, type FeedbackSubmitRequest } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send } from 'lucide-react';

export default function FeedbackForm() {
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('English');
  const [stakeholderType, setStakeholderType] = useState('');
  const [sector, setSector] = useState('');

  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (data: FeedbackSubmitRequest) => feedbackAPI.submit(data),
    onSuccess: () => {
      // Invalidate and refetch feedback list
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
      // Clear form
      setText('');
      setStakeholderType('');
      setSector('');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    mutation.mutate({
      text: text.trim(),
      language,
      stakeholderType: stakeholderType || undefined,
      sector: sector || undefined,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submit Feedback</CardTitle>
        <CardDescription>
          Share your thoughts on the proposed policy. Your feedback will be analyzed for sentiment,
          nuances, and insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Language Selection */}
          <div>
            <label htmlFor="language" className="block text-sm font-medium mb-2">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
            </select>
          </div>

          {/* Feedback Text */}
          <div>
            <label htmlFor="feedback-text" className="block text-sm font-medium mb-2">
              Your Feedback <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="feedback-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your consultation feedback here..."
              rows={6}
              required
            />
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="stakeholder-type" className="block text-sm font-medium mb-2">
                Stakeholder Type (Optional)
              </label>
              <input
                type="text"
                id="stakeholder-type"
                value={stakeholderType}
                onChange={(e) => setStakeholderType(e.target.value)}
                placeholder="e.g., Business Owner, Consumer"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label htmlFor="sector" className="block text-sm font-medium mb-2">
                Sector (Optional)
              </label>
              <input
                type="text"
                id="sector"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g., Healthcare, Technology"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending || !text.trim()}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {mutation.isError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
              Failed to submit feedback. Please try again.
            </div>
          )}

          {/* Success Message */}
          {mutation.isSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
              ✓ Feedback submitted and analyzed successfully!
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
