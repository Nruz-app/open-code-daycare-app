-- Enums del diccionario que faltan: user_role y user_status ya se crearon
-- con la tabla users (SPEC 07).
create type public.relationship_type as enum ('father', 'mother', 'guardian');

create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create type public.post_type as enum ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement');

create type public.child_status as enum ('active', 'archived');
