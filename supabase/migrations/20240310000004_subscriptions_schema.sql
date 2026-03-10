-- ─── Subscriptions ────────────────────────────────────────────────────────────

create table public.subscriptions (
  user_id                uuid        primary key references auth.users(id) on delete cascade,
  stripe_customer_id     text        unique,
  stripe_subscription_id text        unique,
  plan                   text        not null default 'free'
                                     check (plan in ('free', 'starter', 'pro')),
  status                 text        not null default 'active',
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index subscriptions_stripe_customer_idx on public.subscriptions (stripe_customer_id);
create index subscriptions_stripe_sub_idx      on public.subscriptions (stripe_subscription_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions: select own" on public.subscriptions
  for select using (auth.uid() = user_id);

-- Service role (webhook) can upsert freely — no RLS restriction needed at select/update
-- because the webhook uses the service-role key which bypasses RLS.

-- ─── Auto-create free subscription for new users ──────────────────────────────

create or replace function public.create_initial_subscription()
returns trigger language plpgsql security definer as $$
begin
  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created_subscription
  after insert on auth.users
  for each row execute function public.create_initial_subscription();

-- ─── Refresh credits to plan allowance (called by webhook) ───────────────────

create or replace function public.refresh_credits_for_plan(
  p_user_id uuid,
  p_plan    text
)
returns void language plpgsql security definer as $$
declare
  v_credits integer;
begin
  v_credits := case p_plan
    when 'pro'     then 200
    when 'starter' then 50
    else                 10
  end;

  update public.credits
  set balance = v_credits, updated_at = now()
  where user_id = p_user_id;

  insert into public.credit_transactions (user_id, amount, action)
  values (p_user_id, v_credits, 'monthly_refresh_' || p_plan);
end;
$$;
