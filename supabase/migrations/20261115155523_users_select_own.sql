-- Cada persona autenticada lee únicamente su propio perfil.
create policy "users_select_own"
  on public.users
  for select
  to authenticated
  using (auth.uid() = id);
