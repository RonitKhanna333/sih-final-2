"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import FeedbackForm from '@/components/FeedbackForm';
import FeedbackList from '@/components/FeedbackList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their dashboard
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/client/dashboard');
      }
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            OPINIZE
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-Powered eConsultation Analytics Platform
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Multilingual sentiment analysis, nuance detection, and policy insights
          </p>
          
          {/* Login/Register Buttons */}
          <div className="flex justify-center gap-4 mt-6">
            <Link href="/login">
              <Button variant="default" size="lg">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg">
                Register
              </Button>
            </Link>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Feedback Form */}
          <div>
            <FeedbackForm />
          </div>

          {/* Right: Feedback List */}
          <div>
            <FeedbackList />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>
            Powered by FastAPI, Next.js, and advanced NLP models
          </p>
          <p className="mt-1">
            © 2025 OPINIZE - eConsultation AI Analytics
          </p>
        </footer>
      </div>
    </main>
  );
}
