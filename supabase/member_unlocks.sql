create extension if not exists pgcrypto;

create table if not exists public.member_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  user_email text,
  product_id text not null,
  provider text not null default 'razorpay',
  provider_reference text,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint member_unlocks_user_product_key unique (user_id, product_id)
);

alter table public.member_unlocks enable row level security;

create policy "Users can view their own unlocks"
on public.member_unlocks
for select
to authenticated
using (auth.uid() = user_id);
