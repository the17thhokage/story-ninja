-- Create users table (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  display_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create books table
create table public.books (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  title text not null,
  theme text not null check (theme in ('dinosaurs', 'ninjas', 'space', 'underwater', 'fairy_tale', 'superheroes')),
  status text not null default 'draft' check (status in ('draft', 'generating', 'complete', 'failed')),
  is_paid boolean default false not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply updated_at triggers
create trigger users_updated_at
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger books_updated_at
  before update on public.books
  for each row execute function public.handle_updated_at();

-- Enable RLS
alter table public.users enable row level security;
alter table public.books enable row level security;

-- Users RLS: users can only read/write their own row
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Books RLS: users can only CRUD their own books
create policy "Users can view own books"
  on public.books for select
  using (auth.uid() = user_id);

create policy "Users can create own books"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "Users can update own books"
  on public.books for update
  using (auth.uid() = user_id);

create policy "Users can delete own books"
  on public.books for delete
  using (auth.uid() = user_id);

-- Auto-create user profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
