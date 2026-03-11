create table public.pages (
  id            uuid        primary key default gen_random_uuid(),
  book_id       uuid        not null references public.books(id) on delete cascade,
  order_index   integer     not null default 0,
  name          text        not null default 'Page',
  background_color text     not null default '#ffffff',
  elements      jsonb       not null default '[]',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index pages_book_id_idx on public.pages (book_id, order_index);

alter table public.pages enable row level security;

create policy "pages: select own" on public.pages for select
  using (exists (select 1 from public.books where books.id = pages.book_id and books.user_id = auth.uid()));

create policy "pages: insert own" on public.pages for insert
  with check (exists (select 1 from public.books where books.id = pages.book_id and books.user_id = auth.uid()));

create policy "pages: update own" on public.pages for update
  using (exists (select 1 from public.books where books.id = pages.book_id and books.user_id = auth.uid()));

create policy "pages: delete own" on public.pages for delete
  using (exists (select 1 from public.books where books.id = pages.book_id and books.user_id = auth.uid()));

create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();
