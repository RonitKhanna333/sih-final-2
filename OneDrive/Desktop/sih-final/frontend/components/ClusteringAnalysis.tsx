"use client";

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, ChevronDown, ChevronUp } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ClusterData {
  clusters: Record<string, any[]>;
  silhouetteScore: number;
  numClusters: number;
}

export default function ClusteringAnalysis() {
  const [numClusters, setNumClusters] = useState(3);
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  const [clusterData, setClusterData] = useState<ClusterData | null>(null);

  const clusterMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/v1/feedback/cluster/`,
        { numClusters },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    },
    onSuccess: (data) => {
      setClusterData(data);
      // Auto-expand first cluster
      const firstCluster = Object.keys(data.clusters)[0];
      if (firstCluster) {
        setExpandedClusters(new Set([firstCluster]));
      }
    }
  });

  const toggleCluster = (clusterKey: string) => {
    setExpandedClusters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clusterKey)) {
        newSet.delete(clusterKey);
      } else {
        newSet.add(clusterKey);
      }
      return newSet;
    });
  };

  const handleRunClustering = () => {
    clusterMutation.mutate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feedback Clustering Analysis</CardTitle>
        <CardDescription>
          Group similar feedback items using AI-powered clustering
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Cluster Configuration */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-2">
                Number of Clusters (2-10)
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={numClusters}
                onChange={(e) => setNumClusters(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button
              onClick={handleRunClustering}
              disabled={clusterMutation.isPending}
              className="flex-shrink-0"
            >
              {clusterMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <GitBranch className="mr-2 h-4 w-4" />
                  Run Clustering
                </>
              )}
            </Button>
          </div>

          {/* Info Text */}
          <p className="text-sm text-gray-600">
            Clustering groups similar feedback together based on content similarity.
            This helps identify common themes and concerns.
          </p>

          {/* Error Display */}
          {clusterMutation.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Failed to perform clustering. Make sure there's enough feedback data.
            </div>
          )}

          {/* Results */}
          {clusterData && (
            <div className="space-y-4">
              {/* Silhouette Score */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Clustering Quality Score</p>
                    <p className="text-xs text-blue-700 mt-1">
                      Higher scores indicate better-defined clusters
                    </p>
                  </div>
                  <div className="text-3xl font-bold text-blue-700">
                    {(clusterData.silhouetteScore * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Cluster Accordions */}
              <div className="space-y-3">
                {Object.entries(clusterData.clusters).map(([clusterKey, items]) => {
                  const isExpanded = expandedClusters.has(clusterKey);
                  const clusterNum = clusterKey.replace('cluster_', '');
                  
                  return (
                    <div
                      key={clusterKey}
                      className="border rounded-lg overflow-hidden"
                    >
                      {/* Cluster Header */}
                      <button
                        onClick={() => toggleCluster(clusterKey)}
                        className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                            {clusterNum}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900">
                              Cluster {clusterNum}
                            </p>
                            <p className="text-sm text-gray-500">
                              {items.length} feedback items
                            </p>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </button>

                      {/* Cluster Content */}
                      {isExpanded && (
                        <div className="p-4 space-y-3 bg-white">
                          {items.map((item: any, idx: number) => (
                            <div
                              key={item.id || idx}
                              className="p-3 bg-gray-50 rounded-lg border"
                            >
                              <p className="text-sm text-gray-900 mb-2">
                                {item.text}
                              </p>
                              <div className="flex items-center gap-3 text-xs">
                                <span className={`px-2 py-0.5 rounded-full ${
                                  item.sentiment === 'Positive' ? 'bg-green-100 text-green-700' :
                                  item.sentiment === 'Negative' ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {item.sentiment}
                                </span>
                                {item.language && (
                                  <span className="text-gray-500">
                                    {item.language}
                                  </span>
                                )}
                                {item.stakeholderType && (
                                  <span className="text-gray-500">
                                    • {item.stakeholderType}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
