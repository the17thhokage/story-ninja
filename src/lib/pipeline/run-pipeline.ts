import { createServiceClient } from '@/lib/supabase/service';
import { generateStory } from './generate-story';
import { generateIllustrations } from './generate-illustrations';

export async function runPipeline(bookId: string, userId: string) {
  const supabase = createServiceClient();

  // Fetch book
  const { data: book, error } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single();

  if (error || !book) {
    throw new Error('Book not found');
  }

  // Check if pages already exist (retry resume)
  const { data: existingPages } = await supabase
    .from('pages')
    .select('id, status')
    .eq('book_id', bookId);

  const hasPages = existingPages && existingPages.length > 0;
  const hasTextReadyOrComplete =
    hasPages &&
    existingPages.some((p) => p.status === 'text_ready' || p.status === 'complete');

  // Phase 1: Story Generation (skip if pages already exist)
  if (!hasTextReadyOrComplete) {
    await generateStory(bookId, book);
  }

  // Phase 2: Illustration Generation (resume from incomplete pages)
  await generateIllustrations(bookId, userId, book);

  // All done — set status to complete
  const { data: finalPages } = await supabase
    .from('pages')
    .select('status')
    .eq('book_id', bookId);

  const allComplete = finalPages?.every((p) => p.status === 'complete');

  if (allComplete) {
    await supabase.from('books').update({ status: 'complete' }).eq('id', bookId);
  }
}
