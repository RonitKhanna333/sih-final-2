"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface HealthStatus {
  database: string;
  sentimentModel: string;
  embeddingModel: string;
  groqApi: string;
}

export default function SystemStatus() {
  const { data: health, isLoading } = useQuery<HealthStatus>({
    queryKey: ['systemHealth'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/api/v1/analytics/health`);
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    if (status === 'ok' || status === 'loaded' || status === 'configured') {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    } else if (status.startsWith('error')) {
      return <XCircle className="h-5 w-5 text-red-600" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    if (status === 'ok') return 'Connected';
    if (status === 'loaded') return 'Loaded';
    if (status === 'configured') return 'Configured';
    if (status === 'not_loaded') return 'Not Loaded';
    if (status === 'not_configured') return 'Not Configured';
    if (status.startsWith('error')) return 'Error';
    return status;
  };

  const getStatusColor = (status: string) => {
    if (status === 'ok' || status === 'loaded' || status === 'configured') {
      return 'text-green-700 bg-green-50 border-green-200';
    } else if (status.startsWith('error')) {
      return 'text-red-700 bg-red-50 border-red-200';
    } else {
      return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    }
  };

  if (isLoading || !health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Checking system health...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const services = [
    { name: 'Database', status: health.database, description: 'PostgreSQL connection' },
    { name: 'Sentiment Model', status: health.sentimentModel, description: 'AI sentiment analysis' },
    { name: 'Embedding Model', status: health.embeddingModel, description: 'Text embeddings for clustering' },
    { name: 'Groq API', status: health.groqApi, description: 'AI summarization service' }
  ];

  const allHealthy = services.every(s => 
    s.status === 'ok' || s.status === 'loaded' || s.status === 'configured'
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time health monitoring</CardDescription>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            allHealthy ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {allHealthy ? 'All Systems Operational' : 'Degraded Performance'}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {services.map((service) => (
            <div 
              key={service.name}
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(service.status)}`}
            >
              <div className="flex items-center space-x-3">
                {getStatusIcon(service.status)}
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  <p className="text-xs opacity-75">{service.description}</p>
                </div>
              </div>
              <span className="text-sm font-medium">
                {getStatusText(service.status)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-xs text-gray-500 text-center">
          Auto-refreshes every 30 seconds
        </div>
      </CardContent>
    </Card>
  );
}
