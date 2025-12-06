'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function APIDocsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/docs');
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-400 border-r-transparent mb-4"></div>
        <p className="text-slate-400">Redirecting to documentation...</p>
      </div>
    </div>
  );
}
