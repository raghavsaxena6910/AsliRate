-- AsliRate initial schema.
-- Every table has row-level security; users only ever see their own rows.
-- Money is never stored as a float: engine inputs/outputs are kept as JSON
-- with integer paise, exactly as the engine produces them.

-- ---------- helpers ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- profiles (one per user, the company) ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  company_name text,
  gstin text check (gstin is null or gstin ~ '^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$'),
  gst_registered boolean not null default true,
  state_code text check (state_code is null or state_code ~ '^\d{2}$'),
  business_type text,
  city text,
  usually_buys text[] not null default '{}',
  cost_of_funds_pct numeric(5, 2) not null default 12 check (cost_of_funds_pct between 0 and 60),
  default_priority text not null default 'balanced' check (default_priority in ('cost', 'balanced', 'speed')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Create an empty profile for every new sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, company_name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'company_name'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- suppliers (a user's address book) ----------
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  gstin text,
  past_experience text not null default 'none' check (past_experience in ('none', 'good', 'problems')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index suppliers_user_name_key on public.suppliers (user_id, lower(name));
create trigger suppliers_updated_at before update on public.suppliers
  for each row execute function public.set_updated_at();

-- ---------- comparisons (one purchase decision) ----------
create table public.comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_description text not null check (length(trim(item_description)) between 1 and 300),
  specification text,
  unit text not null check (length(trim(unit)) between 1 and 30),
  qty_needed numeric(18, 3) not null check (qty_needed > 0),
  required_by date,
  deliver_to text,
  buyer_gst_registered boolean not null,
  priority text not null default 'balanced' check (priority in ('cost', 'balanced', 'speed', 'custom')),
  weights jsonb,
  status text not null default 'draft' check (status in ('draft', 'reading', 'review', 'complete')),
  share_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index comparisons_user_id_idx on public.comparisons (user_id, created_at desc);
create trigger comparisons_updated_at before update on public.comparisons
  for each row execute function public.set_updated_at();

-- ---------- quotes (one per supplier file inside a comparison) ----------
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null references public.comparisons (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  supplier_id uuid references public.suppliers (id) on delete set null,
  position smallint not null default 0,
  file_path text,               -- object path in the private "quotes" bucket
  file_name text,
  mime_type text,
  file_size bigint check (file_size is null or file_size <= 20971520),
  pasted_text text,             -- when the user pastes a quote instead of uploading
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'reading', 'read', 'failed')),
  extraction_error text,
  extracted jsonb,              -- what the AI read, Zod-validated, never edited
  field_confidence jsonb,
  field_sources jsonb,          -- the quote text each value came from
  confirmed jsonb,              -- engine QuoteInput after the user reviewed it
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (file_path is not null or pasted_text is not null)
);
create index quotes_comparison_id_idx on public.quotes (comparison_id, position);
create index quotes_user_id_idx on public.quotes (user_id);
create index quotes_supplier_id_idx on public.quotes (supplier_id);
create trigger quotes_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();

-- A quote must belong to a comparison owned by the same user.
create or replace function public.quote_owner_matches()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.comparisons c where c.id = new.comparison_id and c.user_id = new.user_id
  ) then
    raise exception 'comparison does not belong to this user';
  end if;
  return new;
end;
$$;
create trigger quotes_owner_check before insert or update on public.quotes
  for each row execute function public.quote_owner_matches();

-- Max 6 quotes per comparison.
create or replace function public.quote_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.quotes q where q.comparison_id = new.comparison_id) >= 6 then
    raise exception 'a comparison can have at most 6 quotes';
  end if;
  return new;
end;
$$;
create trigger quotes_limit before insert on public.quotes
  for each row execute function public.quote_limit();

-- ---------- results (engine output for a comparison) ----------
create table public.results (
  id uuid primary key default gen_random_uuid(),
  comparison_id uuid not null unique references public.comparisons (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  engine_version text not null,
  engine_input jsonb not null,
  engine_output jsonb not null,
  rationale text[],             -- AI-written, from engine numbers only
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index results_user_id_idx on public.results (user_id);
create trigger results_updated_at before update on public.results
  for each row execute function public.set_updated_at();

-- ---------- waitlist (Pro plan interest; no payments) ----------
create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  plan text not null default 'pro',
  source text,
  user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index waitlist_email_plan_key on public.waitlist (lower(email), plan);

-- ---------- row-level security ----------
alter table public.profiles enable row level security;
alter table public.suppliers enable row level security;
alter table public.comparisons enable row level security;
alter table public.quotes enable row level security;
alter table public.results enable row level security;
alter table public.waitlist enable row level security;

create policy "own profile: read" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own suppliers" on public.suppliers for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own comparisons" on public.comparisons for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own quotes" on public.quotes for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "own results" on public.results for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Anyone may join the waitlist; nobody can read it through the API.
create policy "join waitlist" on public.waitlist for insert to anon, authenticated
  with check (user_id is null or user_id = (select auth.uid()));

-- ---------- private storage for quote files ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'quotes', 'quotes', false, 20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv', 'text/plain', 'message/rfc822',
    'image/jpeg', 'image/png', 'image/webp', 'image/heic'
  ]
);

-- Files live under <user id>/<comparison id>/<file>; users only touch their own folder.
create policy "quotes: read own" on storage.objects for select to authenticated
  using (bucket_id = 'quotes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "quotes: upload own" on storage.objects for insert to authenticated
  with check (bucket_id = 'quotes' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "quotes: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'quotes' and (storage.foldername(name))[1] = (select auth.uid())::text);
