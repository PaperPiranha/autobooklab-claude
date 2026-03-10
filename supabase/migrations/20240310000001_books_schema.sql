-- ─── Books ───────────────────────────────────────────────────────────────────

create table public.books (
  id            uuid        default gen_random_uuid() primary key,
  user_id       uuid        references auth.users(id) on delete cascade not null,
  title         text        not null,
  description   text        not null default '',
  genre         text        not null default '',
  cover_image_url text,
  status        text        not null default 'draft'
                            check (status in ('draft', 'published')),
  chapter_count integer     not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index books_user_id_created_idx on public.books (user_id, created_at desc);
-- Composite index for RLS auth checks
create index books_id_user_id_idx     on public.books (id, user_id);

alter table public.books enable row level security;

create policy "books: select own"  on public.books for select  using (auth.uid() = user_id);
create policy "books: insert own"  on public.books for insert  with check (auth.uid() = user_id);
create policy "books: update own"  on public.books for update  using (auth.uid() = user_id);
create policy "books: delete own"  on public.books for delete  using (auth.uid() = user_id);

-- ─── Chapters ────────────────────────────────────────────────────────────────

create table public.chapters (
  id         uuid        default gen_random_uuid() primary key,
  book_id    uuid        references public.books(id) on delete cascade not null,
  title      text        not null,
  content    text        not null default '',
  position   integer     not null default 0,
  word_count integer     not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index chapters_book_position_idx on public.chapters (book_id, position);

alter table public.chapters enable row level security;

-- Use books(id, user_id) composite index for RLS lookups
create policy "chapters: select own" on public.chapters for select
  using (exists (select 1 from public.books where books.id = chapters.book_id and books.user_id = auth.uid()));
create policy "chapters: insert own" on public.chapters for insert
  with check (exists (select 1 from public.books where books.id = chapters.book_id and books.user_id = auth.uid()));
create policy "chapters: update own" on public.chapters for update
  using (exists (select 1 from public.books where books.id = chapters.book_id and books.user_id = auth.uid()));
create policy "chapters: delete own" on public.chapters for delete
  using (exists (select 1 from public.books where books.id = chapters.book_id and books.user_id = auth.uid()));

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger books_updated_at    before update on public.books    for each row execute function public.set_updated_at();
create trigger chapters_updated_at before update on public.chapters for each row execute function public.set_updated_at();

-- ─── chapter_count sync trigger ──────────────────────────────────────────────

create or replace function public.sync_book_chapter_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.books set chapter_count = chapter_count + 1 where id = new.book_id;
  elsif tg_op = 'DELETE' then
    update public.books set chapter_count = greatest(chapter_count - 1, 0) where id = old.book_id;
  end if;
  return null;
end;
$$;

create trigger chapters_count_sync
  after insert or delete on public.chapters
  for each row execute function public.sync_book_chapter_count();
