"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/dashboard-new');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2">
      <span className="text-sm text-muted-foreground">Redirecting to the updated admin dashboard…</span>
    </div>
  );
}
