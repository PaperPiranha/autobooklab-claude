-- Add is_cover flag to pages table
alter table public.pages add column is_cover boolean not null default false;

-- Ensure only one cover page per book
create unique index pages_one_cover_per_book on public.pages (book_id) where (is_cover = true);
