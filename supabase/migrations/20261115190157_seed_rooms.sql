-- Salas de la guardería del staff demo ("Guardería Sala Soles"), que son
-- las opciones del formulario de alta.
insert into public.rooms (daycare_id, name)
select d.id, s.name
from public.daycares d
cross join (
  values ('Soles'), ('Lunas'), ('Estrellas')
) as s(name)
where d.name = 'Guardería Sala Soles';
