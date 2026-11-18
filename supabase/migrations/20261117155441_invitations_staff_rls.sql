-- El staff de la guardería del niño gestiona sus invitaciones:
-- las lee, crea nuevas y cancela pendientes (SPEC 11).
-- Misma cadena de tenencia que rooms_children_staff_rls, un salvoconducto
-- más largo: invitations -> children -> rooms -> users.daycare_id.
create policy "invitations_staff_select"
  on public.invitations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = invitations.child_id
        and u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
    )
  );

create policy "invitations_staff_insert"
  on public.invitations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = invitations.child_id
        and u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
    )
  );

-- La cancelación de pendientes duplicadas es un update de `status`;
-- sin `with check` explícito, la cláusula using también gobierna el check.
create policy "invitations_staff_update"
  on public.invitations
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.children c
      join public.rooms r on r.id = c.room_id
      join public.users u on u.daycare_id = r.daycare_id
      where c.id = invitations.child_id
        and u.id = (select auth.uid())
        and u.role in ('staff', 'admin')
    )
  );
