-- Migration: create user_roles & contact_submissions, enable RLS and add policies
-- Run this with Supabase SQL editor (service_role) to bootstrap tables and policies.

-- Enable pgcrypto if not present
create extension if not exists "pgcrypto";

-- user_roles table (canonical user_id column)
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id),
  role text not null,
  created_at timestamptz default now()
);

-- contact_submissions table
create table if not exists public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text,
  email text,
  message text,
  created_at timestamptz default now(),
  status text default 'unread',
  responded_at timestamptz,
  responded_by uuid,
  client_id uuid
);

-- Enable RLS
alter table public.contact_submissions enable row level security;
alter table public.user_roles enable row level security;

-- Policies for contact_submissions

-- Allow anyone to INSERT contact submissions
create policy "Allow public insert" on public.contact_submissions
  for insert
  using ( true )
  with check ( true );

-- Allow admins to SELECT
create policy "Admins can select" on public.contact_submissions
  for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Allow admins to UPDATE
create policy "Admins can update" on public.contact_submissions
  for update
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur2
      where ur2.user_id = auth.uid() and ur2.role = 'admin'
    )
  );

-- Allow admins to DELETE
create policy "Admins can delete" on public.contact_submissions
  for delete
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- Policies for user_roles
-- Manageable only by admins (seed an admin first using the SQL editor/service role)
create policy "Admins manage user_roles" on public.user_roles
  for all
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur2
      where ur2.user_id = auth.uid() and ur2.role = 'admin'
    )
  );
