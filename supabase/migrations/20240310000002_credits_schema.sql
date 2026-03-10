-- ─── Credits balance ──────────────────────────────────────────────────────────

create table public.credits (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  balance    integer     not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.credits enable row level security;
create policy "credits: select own" on public.credits for select using (auth.uid() = user_id);

-- ─── Credit transaction log ───────────────────────────────────────────────────

create table public.credit_transactions (
  id         uuid        default gen_random_uuid() primary key,
  user_id    uuid        references auth.users(id) on delete cascade not null,
  amount     integer     not null, -- negative = deduction
  action     text        not null,
  created_at timestamptz not null default now()
);

create index credit_txn_user_idx on public.credit_transactions (user_id, created_at desc);

alter table public.credit_transactions enable row level security;
create policy "credit_txns: select own" on public.credit_transactions for select using (auth.uid() = user_id);

-- ─── Atomic spend function ────────────────────────────────────────────────────

create or replace function public.spend_credit(
  p_user_id uuid,
  p_amount  integer,
  p_action  text
)
returns boolean language plpgsql security definer as $$
declare
  v_balance integer;
begin
  -- Security: only allow spending own credits
  if auth.uid() != p_user_id then
    return false;
  end if;

  select balance into v_balance
  from public.credits
  where user_id = p_user_id
  for update;

  if v_balance is null or v_balance < p_amount then
    return false;
  end if;

  update public.credits
  set balance = balance - p_amount, updated_at = now()
  where user_id = p_user_id;

  insert into public.credit_transactions (user_id, amount, action)
  values (p_user_id, -p_amount, p_action);

  return true;
end;
$$;

-- ─── Auto-create 10 credits for new users ─────────────────────────────────────

create or replace function public.create_initial_credits()
returns trigger language plpgsql security definer as $$
begin
  insert into public.credits (user_id, balance)
  values (new.id, 10)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_initial_credits();
