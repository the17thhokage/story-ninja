-- Add error_message to books
alter table public.books
  add column error_message text;

-- Create pages table
create table public.pages (
  id uuid default gen_random_uuid() primary key,
  book_id uuid references public.books(id) on delete cascade not null,
  page_number integer not null,
  text text not null,
  illustration_url text,
  status text not null default 'text_ready' check (status in ('text_ready', 'complete', 'failed')),
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (book_id, page_number)
);

-- updated_at trigger for pages
create trigger pages_updated_at
  before update on public.pages
  for each row execute function public.handle_updated_at();

-- Enable RLS on pages
alter table public.pages enable row level security;

-- Pages RLS: users can read pages for their own books
create policy "Users can view own book pages"
  on public.pages for select
  using (
    exists (
      select 1 from public.books
      where books.id = pages.book_id
      and books.user_id = auth.uid()
    )
  );

-- Pages RLS: users can insert pages for their own books
create policy "Users can create pages for own books"
  on public.pages for insert
  with check (
    exists (
      select 1 from public.books
      where books.id = pages.book_id
      and books.user_id = auth.uid()
    )
  );

-- Pages RLS: users can update pages for their own books
create policy "Users can update own book pages"
  on public.pages for update
  using (
    exists (
      select 1 from public.books
      where books.id = pages.book_id
      and books.user_id = auth.uid()
    )
  );

-- Service role needs full access for pipeline operations
create policy "Service role full access to pages"
  on public.pages for all
  to service_role
  using (true)
  with check (true);

-- Service role needs to update books status during pipeline
create policy "Service role can update books"
  on public.books for all
  to service_role
  using (true)
  with check (true);
