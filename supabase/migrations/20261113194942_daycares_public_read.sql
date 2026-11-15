-- Los nombres de guarderías son datos públicos de la app.
create policy "daycares_public_read"
  on public.daycares
  for select
  to anon, authenticated
  using (true);
