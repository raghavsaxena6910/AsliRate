-- Trigger functions must never be callable through the REST API
-- (flagged by the Supabase security advisor).
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.quote_owner_matches() from public, anon, authenticated;
revoke execute on function public.quote_limit() from public, anon, authenticated;

create index waitlist_user_id_idx on public.waitlist (user_id);
