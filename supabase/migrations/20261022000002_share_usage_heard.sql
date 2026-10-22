-- 1. Read-only share links for results (comparisons.share_token already exists).

-- Public read of one shared result, by token only. Returns nothing unless the
-- owner has turned sharing on. No table access is granted to anonymous users.
create function public.get_shared_result(token text)
returns table (item_description text, specification text, engine_input jsonb, rationale text[], shared_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select c.item_description, c.specification, r.engine_input, r.rationale, r.updated_at
  from public.comparisons c
  join public.results r on r.comparison_id = c.id
  where length(token) >= 20 and c.share_token = token and c.status = 'complete';
$$;
revoke execute on function public.get_shared_result(text) from public;
-- Called only by the server with the secret key (see 20261022000003).
grant execute on function public.get_shared_result(text) to anon, authenticated;

-- 2. Usage log for the free plan, so deleting a comparison doesn't give a free run back.
create table public.comparison_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  comparison_id uuid,               -- no FK: the run stays counted if the comparison is deleted
  created_at timestamptz not null default now()
);
create index comparison_runs_user_month_idx on public.comparison_runs (user_id, created_at);
alter table public.comparison_runs enable row level security;
create policy "own runs: read" on public.comparison_runs for select to authenticated
  using (user_id = (select auth.uid()));

insert into public.comparison_runs (user_id, comparison_id, created_at)
  select user_id, comparison_id, created_at from public.results;

create or replace function public.results_free_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  used int;
begin
  -- Re-running a comparison that already has results doesn't count again.
  if exists (select 1 from public.results r where r.comparison_id = new.comparison_id) then
    return new;
  end if;
  if not public.has_pro(new.user_id) then
    select count(*) into used from public.comparison_runs u
      where u.user_id = new.user_id and u.created_at >= month_start;
    if used >= 3 then
      raise exception 'free plan limit: 3 comparisons a month' using errcode = 'P0001';
    end if;
  end if;
  insert into public.comparison_runs (user_id, comparison_id) values (new.user_id, new.comparison_id);
  return new;
end;
$$;
revoke execute on function public.results_free_limit() from public, anon, authenticated;

-- 3. Where people heard about AsliRate (optional, asked once during setup).
alter table public.profiles add column heard_from text
  check (heard_from is null or heard_from in ('google', 'linkedin', 'whatsapp', 'friend', 'ca', 'class', 'other'));
