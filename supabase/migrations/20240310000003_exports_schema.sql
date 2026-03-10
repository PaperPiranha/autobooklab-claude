-- ============================================================
-- Exports table + Supabase Storage bucket for M5
-- ============================================================

create table public.exports (
  id          uuid        primary key default gen_random_uuid(),
  book_id     uuid        not null references public.books(id) on delete cascade,
  user_id     uuid        not null references auth.users(id)  on delete cascade,
  format      text        not null check (format in ('pdf', 'epub')),
  status      text        not null default 'pending' check (status in ('pending', 'ready', 'failed')),
  file_path   text,
  error_msg   text,
  created_at  timestamptz not null default now()
);

alter table public.exports enable row level security;

create policy "exports: select own" on public.exports
  for select using (user_id = auth.uid());

create policy "exports: insert own" on public.exports
  for insert with check (user_id = auth.uid());

create policy "exports: update own" on public.exports
  for update using (user_id = auth.uid());

create policy "exports: delete own" on public.exports
  for delete using (user_id = auth.uid());

create index exports_user_id_created_idx on public.exports (user_id, created_at desc);
create index exports_book_id_idx          on public.exports (book_id);

-- ============================================================
-- Storage bucket for export files (private, signed-URL access)
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('exports', 'exports', false, 52428800)   -- 50 MB max
on conflict (id) do nothing;

-- Users can upload into their own folder: exports/<user_id>/...
create policy "exports storage: user upload" on storage.objects
  for insert with check (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "exports storage: user read" on storage.objects
  for select using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "exports storage: user delete" on storage.objects
  for delete using (
    bucket_id = 'exports'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
