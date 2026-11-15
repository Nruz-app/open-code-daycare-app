-- Ajustes de la spec 07 tras los avisos del linter de Supabase:
-- 0011 function_search_path_mutable: set_updated_at sin search_path fijo.
-- 0028/0029 handle_new_user ejecutable por anon/authenticated via RPC REST.
-- El EXECUTE se revoca de PUBLIC (el default de las funciones) y se regranta
-- solo a supabase_auth_admin, el rol que inserta en auth.users y dispara el trigger.
alter function public.set_updated_at() set search_path = '';

revoke execute on function public.handle_new_user() from public;
grant execute on function public.handle_new_user() to supabase_auth_admin;
