'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Illustration {
  page_number: number;
  illustration_url: string;
}

interface ProgressData {
  book_status: string;
  total_pages: number | null;
  pages_complete: number;
  illustrations: Illustration[];
  error_message: string | null;
}

export default function GeneratingPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();

  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [triggered, setTriggered] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const completionTimesRef = useRef<number[]>([]);
  const lastCompleteCountRef = useRef(0);

  // Trigger generation on mount (only for draft/failed books)
  const triggerGeneration = useCallback(async () => {
    try {
      const res = await fetch(`/api/books/${bookId}/generate`, { method: 'POST' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // 409 means already generating — that's fine, just poll
        if (res.status !== 409) {
          setError(body.error || 'Failed to start generation');
          return;
        }
      }
      setTriggered(true);
      setError(null);
    } catch {
      setError('Network error. Please try again.');
    }
  }, [bookId]);

  useEffect(() => {
    triggerGeneration();
  }, [triggerGeneration]);

  // Poll progress every 3 seconds
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/books/${bookId}/progress`);
        if (!res.ok) return;
        const { data } = (await res.json()) as { data: ProgressData };
        if (!active) return;

        // Track completion times for ETA
        if (data.pages_complete > lastCompleteCountRef.current) {
          completionTimesRef.current.push(Date.now());
          lastCompleteCountRef.current = data.pages_complete;
        }

        setProgress(data);

        if (data.book_status === 'failed') {
          setError(data.error_message || 'Generation failed');
        } else {
          setError(null);
        }
      } catch {
        // Silently ignore poll errors
      }
    };

    // Start polling immediately, then every 3 seconds
    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [bookId, triggered, retrying]);

  // Stop polling when complete or failed
  const isDone = progress?.book_status === 'complete';
  const isFailed = progress?.book_status === 'failed';
  const isGenerating = !isDone && !isFailed;

  const totalPages = progress?.total_pages ?? 0;
  const pagesComplete = progress?.pages_complete ?? 0;
  const percent = totalPages > 0 ? Math.round((pagesComplete / totalPages) * 100) : 0;

  // ETA calculation
  const getEta = () => {
    const times = completionTimesRef.current;
    if (times.length < 2) return 'Estimating time...';
    const remaining = totalPages - pagesComplete;
    if (remaining <= 0) return '';
    const avgMs =
      (times[times.length - 1] - times[0]) / (times.length - 1);
    const remainingMinutes = Math.ceil((avgMs * remaining) / 60000);
    return `About ${remainingMinutes} minute${remainingMinutes === 1 ? '' : 's'} left`;
  };

  // Status text
  const getStatusText = () => {
    if (isDone) return 'Your book is ready!';
    if (isFailed) return 'Something went wrong';
    if (!progress?.total_pages) return 'Writing your story...';
    if (pagesComplete < totalPages) {
      return `Illustrating page ${pagesComplete + 1} of ${totalPages}...`;
    }
    return 'Finishing up...';
  };

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    completionTimesRef.current = [];
    lastCompleteCountRef.current = 0;
    await triggerGeneration();
    setRetrying(false);
  };

  // Generate signed URL for illustration thumbnail
  const getIllustrationSrc = (illustration: Illustration) => {
    // The progress endpoint returns storage paths — we'll need a signed URL endpoint
    // For now use the path directly via Supabase storage public URL pattern
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    return `${supabaseUrl}/storage/v1/object/authenticated/child-photos/${illustration.illustration_url}`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Status */}
        <div className="text-center">
          {isGenerating && !isFailed && (
            <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          )}
          {isDone && (
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {isFailed && (
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}

          <h1 className="text-2xl font-bold text-gray-900">{getStatusText()}</h1>

          {isGenerating && (
            <p className="mt-2 text-sm text-gray-500">{getEta()}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-8">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{totalPages > 0 ? `${pagesComplete} of ${totalPages} pages` : 'Starting...'}</span>
            <span>{percent}%</span>
          </div>
          <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Page slots — horizontal strip */}
        {totalPages > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-medium text-gray-700">Pages</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNum = i + 1;
                const illustration = progress?.illustrations.find(
                  (il) => il.page_number === pageNum
                );
                return (
                  <div
                    key={pageNum}
                    className="relative flex h-20 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
                  >
                    {illustration ? (
                      <img
                        src={getIllustrationSrc(illustration)}
                        alt={`Page ${pageNum}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <div className="h-8 w-10 animate-pulse rounded bg-gray-200" />
                        <span className="text-xs text-gray-400">{pageNum}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {retrying ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}

        {/* Completion CTA */}
        {isDone && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push(`/books/${bookId}`)}
              className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white shadow-md hover:bg-blue-700"
            >
              Preview My Book
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
