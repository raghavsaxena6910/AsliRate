-- Shared results are read by the server (secret key), not directly by browsers.
revoke execute on function public.get_shared_result(text) from public, anon, authenticated;
grant execute on function public.get_shared_result(text) to service_role;
