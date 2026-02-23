-- Create child-photos storage bucket (private)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'child-photos',
  'child-photos',
  false,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp']
);

-- RLS: authenticated users can upload to their own folder
create policy "Users can upload to own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: authenticated users can read from their own folder
create policy "Users can read own folder"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: authenticated users can delete from their own folder
create policy "Users can delete from own folder"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'child-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
