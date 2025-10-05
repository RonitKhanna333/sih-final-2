"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Info, GitBranch } from 'lucide-react';
import { aiAnalyticsAPI, type DebateMapResponse } from '@/lib/api';
import type { Config, Layout, PlotData } from 'plotly.js';

const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function DebateMap() {
  const [regenerate, setRegenerate] = useState(false);

  const { data, isLoading, error, refetch } = useQuery<DebateMapResponse>({
    queryKey: ['debateMap', regenerate],
    queryFn: () => aiAnalyticsAPI.getDebateMap(regenerate),
    staleTime: 3600000, // Cache for 1 hour
  });

  const handleRegenerate = () => {
    setRegenerate(true);
    refetch().then(() => setRegenerate(false));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debate Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-gray-600">Generating debate map...</p>
            <p className="text-sm text-gray-500">
              This may take 15-30 seconds for large datasets
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Debate Map</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Failed to generate debate map. Ensure sufficient feedback data exists (minimum 10 items).
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  // Detect minimal/flat mode (all y ~ 0 or single cluster)
  const allY = data.points.map((point) => point.y);
  const yVar = allY.length > 1 ? Math.max(...allY) - Math.min(...allY) : 0;
  const isFlat = Math.abs(yVar) < 1e-6;
  const isSingleCluster = new Set(data.points.map((point) => point.clusterId)).size <= 1;

  // Prepare Plotly data
  const traces: Array<Partial<PlotData>> = data.clusters.map((cluster): Partial<PlotData> => {
    const clusterPoints = data.points.filter((point) => point.clusterId === cluster.id);

    return {
      x: clusterPoints.map((point) => point.x),
      y: clusterPoints.map((point) => point.y),
      mode: 'markers',
      type: 'scatter',
      name: cluster.label,
      text: clusterPoints.map(
        (point) =>
          `${point.text.substring(0, 100)}...<br>` +
          `Sentiment: ${point.sentiment}<br>` +
          `Stakeholder: ${point.stakeholderType || 'General'}`
      ),
      hoverinfo: 'text',
      marker: {
        size: 8,
        color: cluster.color,
        opacity: 0.7,
        line: {
          color: 'white',
          width: 1,
        },
      },
    };
  });

  // Add noise points (clusterId: -1) if any
  const noisePoints = data.points.filter((point) => point.clusterId === -1);
  if (noisePoints.length > 0) {
  traces.push({
      x: noisePoints.map((point) => point.x),
      y: noisePoints.map((point) => point.y),
      mode: 'markers',
      type: 'scatter',
      name: 'Uncategorized',
      text: noisePoints.map(
        (point) => `${point.text.substring(0, 100)}...<br>Sentiment: ${point.sentiment}`
      ),
      hoverinfo: 'text',
      marker: {
        size: 6,
        color: '#9ca3af',
        opacity: 0.4,
        line: { color: 'white', width: 1 },
      },
    });
  }

  const layout: Partial<Layout> = {
    title: {
      text: 'Opinion Landscape - Interactive Debate Map',
      font: { size: 18, color: '#374151' }
    },
    xaxis: {
      title: { text: 'Dimension 1' },
      showgrid: true,
      gridcolor: '#e5e7eb',
      zeroline: false
    },
    yaxis: {
      title: { text: 'Dimension 2' },
      showgrid: true,
      gridcolor: '#e5e7eb',
      zeroline: false
    },
    hovermode: 'closest',
    plot_bgcolor: '#f9fafb',
    paper_bgcolor: 'white',
    height: 600,
    legend: {
      x: 1.05,
      y: 1,
      orientation: 'v'
    },
    margin: { l: 60, r: 200, t: 60, b: 60 }
  };

  const modeBarButtonsToRemove: NonNullable<Config['modeBarButtonsToRemove']> = ['select2d', 'lasso2d'];
  const config: Partial<Config> = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove,
    displaylogo: false,
  };

  return (
    <div className="space-y-6">
      {(isFlat || isSingleCluster) && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
          Opinion landscape is in minimal/flat mode. This happens when embeddings are unavailable or data is limited. You can still hover to view items; add more feedback or enable the embedding model for richer clusters.
        </div>
      )}
      {/* Map Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-6 w-6 text-indigo-600" />
                Stakeholder Consensus & Conflict Map
              </CardTitle>
              <CardDescription>
                Visual representation of opinion clusters and debate fault lines
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleRegenerate}
              disabled={isLoading || regenerate}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${regenerate ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-white rounded-lg border">
            <Plot
              data={traces}
              layout={layout}
              config={config}
              style={{ width: '100%' }}
            />
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 mb-1">How to Read This Map:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• <strong>Each point</strong> represents one feedback submission</li>
                  <li>• <strong>Distance between points</strong> indicates similarity in content/opinion</li>
                  <li>• <strong>Clusters (colors)</strong> represent distinct opinion groups</li>
                  <li>• <strong>Hover over points</strong> to read the full feedback</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Narrative Summary */}
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="text-indigo-900">AI Analysis: Debate Landscape</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800 leading-relaxed">{data.narrative}</p>
        </CardContent>
      </Card>

      {/* Cluster Details */}
      <Card>
        <CardHeader>
          <CardTitle>Opinion Clusters Identified</CardTitle>
          <CardDescription>
            {data.clusters.length} distinct groups found across {data.points.length} feedback items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-4 rounded-lg border-2"
                style={{ borderColor: cluster.color, backgroundColor: `${cluster.color}10` }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm">{cluster.label}</h4>
                  <span
                    className="px-2 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: cluster.color, color: 'white' }}
                  >
                    {cluster.size} items
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Sentiment:</span>
                    <span className={`px-2 py-0.5 rounded ${
                      cluster.averageSentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                      cluster.averageSentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {cluster.averageSentiment}
                    </span>
                  </div>
                  {cluster.keyThemes.length > 0 && (
                    <div>
                      <span className="text-gray-600">Key Themes:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {cluster.keyThemes.map((theme, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-gray-100 rounded text-gray-700"
                          >
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Conflict Zones & Consensus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conflict Zones */}
        {data.conflictZones.length > 0 && (
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-900 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Conflict Zones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.conflictZones.map((conflict, index) => (
                  <li key={index} className="p-3 bg-red-50 border border-red-200 rounded text-sm">
                    <p className="font-medium text-red-900 mb-1">
                      {conflict.cluster1} ↔ {conflict.cluster2}
                    </p>
                    <p className="text-red-700 text-xs">{conflict.description}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Consensus Areas */}
        {data.consensusAreas.length > 0 && (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900 flex items-center gap-2">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Consensus Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.consensusAreas.map((area, index) => (
                  <li key={index} className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                    <p className="font-medium text-green-900">{area}</p>
                    <p className="text-green-700 text-xs mt-1">
                      Strong positive agreement in this area
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
