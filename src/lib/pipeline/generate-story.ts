import { createServiceClient } from '@/lib/supabase/service';

// Placeholder — will be implemented with Vercel AI SDK + GPT-4o
export async function generateStory(
  bookId: string,
  book: { child_name: string; child_age: number; theme: string }
) {
  const supabase = createServiceClient();

  // TODO: Replace with actual GPT-4o call via Vercel AI SDK
  // For now, generate placeholder pages
  const pageCount = 10;
  const pages = Array.from({ length: pageCount }, (_, i) => ({
    page_number: i + 1,
    text: `Page ${i + 1}: ${book.child_name} embarked on an amazing ${book.theme} adventure. The world was full of wonder and excitement.`,
  }));

  for (const page of pages) {
    const { error } = await supabase.from('pages').insert({
      book_id: bookId,
      page_number: page.page_number,
      text: page.text,
      status: 'text_ready',
    });

    if (error) {
      throw new Error(`Failed to insert page ${page.page_number}: ${error.message}`);
    }
  }
}
