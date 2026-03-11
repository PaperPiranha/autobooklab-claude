-- Allow anyone (including anonymous users) to read published books and their chapters.
-- This enables the public reading page at /p/[bookId] to work without a service-role key.

create policy "books: select published"
  on public.books for select
  using (status = 'published');

create policy "chapters: select published book"
  on public.chapters for select
  using (
    exists (
      select 1 from public.books
      where books.id = chapters.book_id
        and books.status = 'published'
    )
  );
