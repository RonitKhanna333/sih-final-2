"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, AlertTriangle, TrendingUp, TrendingDown, Minus, Lightbulb } from 'lucide-react';
import { Policy } from '@/lib/api';

// Using Next.js API routes - no external backend needed
const API_BASE = '/api';

interface StakeholderImpact {
  stakeholderType: string;
  currentSentiment: string;
  predictedSentiment: string;
  sentimentShiftPercentage: number;
  keyDrivers: string[];
  riskLevel: string;
}

interface SimulationResult {
  summary: string;
  identifiedChange: string;
  overallRiskAssessment: string;
  stakeholderImpacts: StakeholderImpact[];
  emergingConcerns: string[];
  consensusImpact: string;
  recommendations: string[];
  confidence: number;
}

interface PolicySandboxProps {
  policy?: Policy;
}

export default function PolicySandbox({ policy }: PolicySandboxProps) {
  const [originalText, setOriginalText] = useState(
    policy?.fullText.substring(0, 500) || "Data breach notification must be provided to affected individuals within 72 hours of discovery."
  );
  const [modifiedText, setModifiedText] = useState(
    "Data breach notification must be provided to affected individuals within 48 hours of discovery."
  );
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const simulateMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/summary`,
        {
          originalText,
          modifiedText
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setSimulationResult(data);
    }
  });

  const handleSimulate = () => {
    if (!originalText.trim() || !modifiedText.trim()) {
      alert('Please enter both original and modified policy text');
      return;
    }
    simulateMutation.mutate();
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-700 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'Positive': return <TrendingUp className="h-5 w-5 text-green-600" />;
      case 'Negative': return <TrendingDown className="h-5 w-5 text-red-600" />;
      default: return <Minus className="h-5 w-5 text-yellow-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-indigo-600" />
            Policy Sandbox - What-If Analysis
          </CardTitle>
          <CardDescription>
            Test policy changes before implementation. The AI will predict stakeholder reactions
            based on historical feedback data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original Policy */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Original Policy Clause
                <span className="text-xs text-gray-500">(Current version)</span>
              </label>
              <Textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                rows={8}
                className="font-mono text-sm"
                placeholder="Enter the current policy text..."
              />
            </div>

            {/* Modified Policy */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                Modified Policy Clause
                <span className="text-xs text-indigo-600">(Proposed change)</span>
              </label>
              <Textarea
                value={modifiedText}
                onChange={(e) => setModifiedText(e.target.value)}
                rows={8}
                className="font-mono text-sm border-indigo-300 focus:ring-indigo-500"
                placeholder="Enter the proposed policy change..."
              />
            </div>
          </div>

          {/* Simulate Button */}
          <div className="mt-6">
            <Button
              onClick={handleSimulate}
              disabled={simulateMutation.isPending}
              size="lg"
              className="w-full sm:w-auto"
            >
              {simulateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Simulating Impact...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Run Impact Simulation
                </>
              )}
            </Button>
            {simulateMutation.isPending && (
              <p className="text-sm text-gray-500 mt-2">
                Analyzing change → Retrieving stakeholder data → Predicting reactions...
              </p>
            )}
          </div>

          {/* Error Display */}
          {simulateMutation.isError && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Simulation failed. Ensure sufficient historical feedback data exists.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Simulation Results */}
      {simulationResult && (
        <div className="space-y-6">
          {/* Identified Change */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Identified Change</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 italic">&ldquo;{simulationResult.identifiedChange}&rdquo;</p>
            </CardContent>
          </Card>

          {/* Executive Summary */}
          <Card className={`border-2 ${
            simulationResult.overallRiskAssessment.includes('HIGH') ? 'border-red-300' :
            simulationResult.overallRiskAssessment.includes('MEDIUM') ? 'border-yellow-300' :
            'border-green-300'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${
                  simulationResult.overallRiskAssessment.includes('HIGH') ? 'text-red-600' :
                  simulationResult.overallRiskAssessment.includes('MEDIUM') ? 'text-yellow-600' :
                  'text-green-600'
                }`} />
                Overall Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`p-4 rounded-lg border-2 ${
                simulationResult.overallRiskAssessment.includes('HIGH') ? getRiskColor('high') :
                simulationResult.overallRiskAssessment.includes('MEDIUM') ? getRiskColor('medium') :
                getRiskColor('low')
              }`}>
                <p className="font-semibold text-lg">{simulationResult.overallRiskAssessment}</p>
              </div>
              <p className="text-gray-700">{simulationResult.summary}</p>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Confidence Level:</span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all"
                    style={{ width: `${simulationResult.confidence}%` }}
                  ></div>
                </div>
                <span className="font-medium">{simulationResult.confidence}%</span>
              </div>
            </CardContent>
          </Card>

          {/* Stakeholder Impacts */}
          <Card>
            <CardHeader>
              <CardTitle>Predicted Stakeholder Impacts</CardTitle>
              <CardDescription>
                How different groups are likely to react to this change
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {simulationResult.stakeholderImpacts.map((impact, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getRiskColor(impact.riskLevel)}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{impact.stakeholderType}</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(impact.riskLevel)}`}>
                        {impact.riskLevel.toUpperCase()} RISK
                      </span>
                    </div>
                    
                    {/* Sentiment Shift */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(impact.currentSentiment)}
                        <span className="text-sm font-medium">{impact.currentSentiment}</span>
                      </div>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                        <span className="text-xs font-semibold text-gray-600">
                          {impact.sentimentShiftPercentage}% shift
                        </span>
                        <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getSentimentIcon(impact.predictedSentiment)}
                        <span className="text-sm font-medium">{impact.predictedSentiment}</span>
                      </div>
                    </div>
                    
                    {/* Key Drivers */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">Key Drivers:</p>
                      <ul className="space-y-1">
                        {impact.keyDrivers.map((driver, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-gray-400">•</span>
                            <span>{driver}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emerging Concerns & Consensus Impact */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emerging Concerns</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {simulationResult.emergingConcerns.map((concern, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>{concern}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consensus Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{simulationResult.consensusImpact}</p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-indigo-900">
                <Lightbulb className="h-6 w-6" />
                AI Recommendations
              </CardTitle>
              <CardDescription className="text-indigo-700">
                Strategic actions to address predicted concerns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {simulationResult.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="text-gray-800">{recommendation}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
