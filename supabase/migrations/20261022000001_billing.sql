-- Billing: Pro subscriptions (paid through Dodo Payments) and the free-plan limit.
--
-- Only the server writes subscriptions, using the secret key after verifying a
-- Dodo webhook or a Dodo API response. Signed-in users can read their own row.

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  provider text not null default 'dodo',
  customer_id text,
  subscription_id text unique,
  product_id text,
  status text not null,               -- Dodo status: pending, active, on_hold, paused, cancelled, failed, expired, past_due
  current_period_end timestamptz,      -- Dodo next_billing_date
  cancel_at_period_end boolean not null default false,
  last_event_at timestamptz,           -- newest Dodo event applied; older events are ignored
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_customer_id_idx on public.subscriptions (customer_id);
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;
create policy "own subscription: read" on public.subscriptions for select to authenticated
  using (user_id = (select auth.uid()));

-- Pro if the subscription is paid up, or cancelled but still inside the period paid for.
create function public.has_pro(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = uid
      and (
        s.status in ('active', 'past_due')
        or (s.status in ('cancelled', 'expired') and s.current_period_end > now())
      )
  );
$$;
revoke execute on function public.has_pro(uuid) from public, anon, authenticated;

-- Free plan: 3 comparisons with results per calendar month (India time).
-- Re-running a comparison that already has results doesn't count again.
create function public.results_free_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  month_start timestamptz := date_trunc('month', now() at time zone 'Asia/Kolkata') at time zone 'Asia/Kolkata';
  used int;
begin
  if exists (select 1 from public.results r where r.comparison_id = new.comparison_id) then
    return new;
  end if;
  if public.has_pro(new.user_id) then
    return new;
  end if;
  select count(*) into used from public.results r
    where r.user_id = new.user_id and r.created_at >= month_start;
  if used >= 3 then
    raise exception 'free plan limit: 3 comparisons a month' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke execute on function public.results_free_limit() from public, anon, authenticated;
create trigger results_free_limit before insert on public.results
  for each row execute function public.results_free_limit();
