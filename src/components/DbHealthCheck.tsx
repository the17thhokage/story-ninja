'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function DbHealthCheck() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('localhost') ||
    process.env.NEXT_PUBLIC_APP_URL?.includes('vercel.app');

  useEffect(() => {
    if (!isDev) return;

    async function check() {
      try {
        const supabase = createClient();
        const { error } = await supabase.from('users').select('id').limit(1);
        // Even if the table is empty or RLS blocks, the query itself succeeding means DB is reachable
        // An actual connection error would throw or return a specific error code
        if (error && error.code === 'PGRST301') {
          // RLS or auth error — DB is still reachable
          setStatus('connected');
        } else if (error && error.message?.includes('fetch')) {
          setStatus('error');
        } else {
          setStatus('connected');
        }
      } catch {
        setStatus('error');
      }
    }

    check();
  }, [isDev]);

  if (!isDev) return null;

  return (
    <div className="fixed bottom-4 right-4 text-xs">
      {status === 'checking' && <span className="text-gray-400">Checking DB...</span>}
      {status === 'connected' && <span className="text-green-600">DB connected</span>}
      {status === 'error' && <span className="text-red-600">DB error</span>}
    </div>
  );
}
