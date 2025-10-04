"use client";

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, 
  ThumbsUp, 
  ThumbsDown, 
  Minus, 
  TrendingUp, 
  Languages,
  Users
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface KPIData {
  totalSubmissions: number;
  averageSubmissionsPerDay: number;
  positiveFeedback: number;
  negativeFeedback: number;
  neutralFeedback: number;
  totalLanguages: number;
  totalStakeholderTypes: number;
}

export default function DashboardKPIs() {
  const { data: kpis, isLoading, error } = useQuery<KPIData>({
    queryKey: ['kpis'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/v1/analytics/kpis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !kpis) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
        Failed to load KPIs. Please try refreshing the page.
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Total Submissions",
      value: kpis.totalSubmissions.toLocaleString(),
      description: `Avg ${kpis.averageSubmissionsPerDay}/day`,
      icon: MessageCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Positive Feedback",
      value: kpis.positiveFeedback.toLocaleString(),
      description: `${kpis.totalSubmissions > 0 ? ((kpis.positiveFeedback / kpis.totalSubmissions) * 100).toFixed(1) : 0}% of total`,
      icon: ThumbsUp,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Negative Feedback",
      value: kpis.negativeFeedback.toLocaleString(),
      description: `${kpis.totalSubmissions > 0 ? ((kpis.negativeFeedback / kpis.totalSubmissions) * 100).toFixed(1) : 0}% of total`,
      icon: ThumbsDown,
      color: "text-red-600",
      bgColor: "bg-red-100"
    },
    {
      title: "Neutral Feedback",
      value: kpis.neutralFeedback.toLocaleString(),
      description: `${kpis.totalSubmissions > 0 ? ((kpis.neutralFeedback / kpis.totalSubmissions) * 100).toFixed(1) : 0}% of total`,
      icon: Minus,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100"
    },
    {
      title: "Languages",
      value: kpis.totalLanguages.toLocaleString(),
      description: "Unique languages detected",
      icon: Languages,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      title: "Stakeholder Types",
      value: kpis.totalStakeholderTypes.toLocaleString(),
      description: "Different stakeholder groups",
      icon: Users,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100"
    },
    {
      title: "Engagement Rate",
      value: `${kpis.averageSubmissionsPerDay.toFixed(1)}/day`,
      description: "Average daily submissions",
      icon: TrendingUp,
      color: "text-teal-600",
      bgColor: "bg-teal-100"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <div className={`${kpi.bgColor} p-2 rounded-lg`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {kpi.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {kpi.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
