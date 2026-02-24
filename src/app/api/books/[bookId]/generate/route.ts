import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const maxDuration = 300;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const { bookId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch book and verify ownership
  const { data: book, error: fetchError } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // Check photo_paths
  if (!book.photo_paths || book.photo_paths.length === 0) {
    return NextResponse.json({ error: 'No photos uploaded for this book' }, { status: 422 });
  }

  // Check status
  if (book.status !== 'draft' && book.status !== 'failed') {
    return NextResponse.json(
      { error: 'Book is already generating or complete' },
      { status: 409 }
    );
  }

  // If failed, reset to draft first
  if (book.status === 'failed') {
    await supabase
      .from('books')
      .update({ status: 'draft', error_message: null })
      .eq('id', bookId);
  }

  // Set status to generating
  await supabase.from('books').update({ status: 'generating' }).eq('id', bookId);

  // Fire-and-forget pipeline execution
  // Import dynamically to avoid bundling pipeline code in the initial response
  const runPipelineAsync = async () => {
    try {
      const { runPipeline } = await import('@/lib/pipeline/run-pipeline');
      await runPipeline(bookId, user.id);
    } catch (error) {
      console.error('Pipeline error:', error);
      // Use service role client for pipeline operations
      const { createServiceClient } = await import('@/lib/supabase/service');
      const serviceSupabase = createServiceClient();
      await serviceSupabase
        .from('books')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Pipeline failed unexpectedly',
        })
        .eq('id', bookId);
    }
  };

  // Use waitUntil if available (Vercel), otherwise detached promise
  const g = globalThis as unknown as { waitUntil?: (p: Promise<unknown>) => void };
  if (typeof g.waitUntil === 'function') {
    g.waitUntil(runPipelineAsync());
  } else {
    runPipelineAsync();
  }

  return NextResponse.json(
    { data: { book_id: bookId, status: 'generating' } },
    { status: 202 }
  );
}
