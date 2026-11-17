-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles & Roles
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  role text default 'student' check (role in ('student', 'admin')),
  created_at timestamptz default now()
);

-- 2. Lost & Found Items
create table if not exists public.items (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('lost', 'found')),
  title text not null,
  description text not null,
  category text not null,
  color text,
  brand text,
  location text not null,
  image_url text,
  status text default 'open' check (status in ('open', 'claimed', 'resolved', 'flagged')),
  created_at timestamptz default now()
);

-- 3. Claim Verification Requests
create table if not exists public.claims (
  id uuid default uuid_generate_v4() primary key,
  item_id uuid references public.items(id) on delete cascade not null,
  claimant_id uuid references public.profiles(id) on delete cascade not null,
  proof_description text not null,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.claims enable row level security;

-- Policies for Items
create policy "Anyone can view open items"
  on public.items for select using (status != 'flagged');

create policy "Authenticated users can insert items"
  on public.items for insert with check (auth.uid() = user_id);

create policy "Owners or admins can update items"
  on public.items for update using (
    auth.uid() = user_id or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Policies for Claims
create policy "Users can view their own claims or claims on their items"
  on public.claims for select using (
    auth.uid() = claimant_id or
    exists (select 1 from public.items where id = item_id and user_id = auth.uid()) or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "Authenticated users can submit claims"
  on public.claims for insert with check (auth.uid() = claimant_id);
