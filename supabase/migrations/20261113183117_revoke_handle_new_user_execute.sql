-- Complemento de harden_user_functions: los default privileges de Supabase conceden
-- EXECUTE explicito a anon y authenticated ademas del grant a PUBLIC, por eso el
-- revoke de PUBLIC no basto para silenciar los lints 0028/0029.
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;
