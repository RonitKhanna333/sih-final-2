/**
 * PolicyContext Component - Display current policy being consulted
 */
"use client";

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Policy } from '@/lib/api';

interface PolicyContextProps {
  policy: Policy;
}

export default function PolicyContext({ policy }: PolicyContextProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4 flex-1">
          <div className="bg-blue-600 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900">{policy.title}</h3>
              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                {policy.status.toUpperCase()}
              </span>
              {policy.category && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {policy.category}
                </span>
              )}
            </div>
            <p className="text-gray-700 text-sm mb-3">{policy.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Version {policy.version}</span>
              <span>•</span>
              <span>{policy.feedbackCount} comments received</span>
              <span>•</span>
              <span>Updated {new Date(policy.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>{isExpanded ? 'Hide' : 'Read'} Full Policy</span>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded Policy Text */}
      {isExpanded && (
        <div className="mt-6 pt-6 border-t border-blue-200">
          <div className="bg-white rounded-lg p-6 max-h-[600px] overflow-y-auto">
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
              {policy.fullText}
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Print Policy</span>
            </button>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-4 p-4 bg-blue-100 rounded-lg">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">📢 Your opinion matters!</span> Submit your feedback below to help shape this policy.
          All comments are analyzed using AI to understand sentiment, identify concerns, and predict implementation impact.
        </p>
      </div>
    </div>
  );
}
