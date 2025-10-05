"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireClient?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requireClient = false 
}: ProtectedRouteProps) {
  const { loading, isAuthenticated, isAdmin, isClient } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not authenticated - redirect to login
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Authenticated but wrong role
      if (requireAdmin && !isAdmin) {
        router.push('/client/dashboard');
        return;
      }

      if (requireClient && !isClient) {
        router.push('/admin/dashboard');
        return;
      }
    }
  }, [loading, isAuthenticated, isAdmin, isClient, requireAdmin, requireClient, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Wrong role
  if ((requireAdmin && !isAdmin) || (requireClient && !isClient)) {
    return null;
  }

  return <>{children}</>;
}
