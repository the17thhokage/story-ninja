import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

  // Fetch book
  const { data: book, error: bookError } = await supabase
    .from('books')
    .select('status, error_message')
    .eq('id', bookId)
    .eq('user_id', user.id)
    .single();

  if (bookError || !book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 });
  }

  // Fetch pages
  const { data: pages } = await supabase
    .from('pages')
    .select('page_number, illustration_url, status')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true });

  const allPages = pages || [];
  const totalPages = allPages.length > 0 ? allPages.length : null;
  const pagesComplete = allPages.filter((p) => p.status === 'complete').length;
  const illustrations = allPages
    .filter((p) => p.status === 'complete' && p.illustration_url)
    .map((p) => ({
      page_number: p.page_number,
      illustration_url: p.illustration_url,
    }));

  return NextResponse.json({
    data: {
      book_status: book.status,
      total_pages: totalPages,
      pages_complete: pagesComplete,
      illustrations,
      error_message: book.error_message,
    },
  });
}
