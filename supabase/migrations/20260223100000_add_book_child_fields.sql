-- Add child profile fields to books table
alter table public.books
  add column child_name text,
  add column child_age integer,
  add column photo_paths text[];

-- Add constraints
alter table public.books
  add constraint books_child_name_length check (char_length(child_name) between 1 and 50),
  add constraint books_child_age_range check (child_age between 1 and 10),
  add constraint books_photo_paths_length check (array_length(photo_paths, 1) between 1 and 3);
