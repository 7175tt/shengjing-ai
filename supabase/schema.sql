-- 聲境 AI 正式版：在全新的 Supabase 專案 SQL Editor 執行一次。
create extension if not exists pgcrypto;

create table if not exists public.story_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名作品',
  body text not null default '',
  style text not null default '逆境再起',
  cue_sheet jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_body_limit check (char_length(body) <= 20000)
);

create index if not exists story_projects_owner_updated_idx
  on public.story_projects(owner_id, updated_at desc);

alter table public.story_projects enable row level security;

drop policy if exists "owners can read stories" on public.story_projects;
create policy "owners can read stories" on public.story_projects
  for select using (auth.uid() = owner_id);

drop policy if exists "owners can create stories" on public.story_projects;
create policy "owners can create stories" on public.story_projects
  for insert with check (auth.uid() = owner_id);

drop policy if exists "owners can update stories" on public.story_projects;
create policy "owners can update stories" on public.story_projects
  for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "owners can delete stories" on public.story_projects;
create policy "owners can delete stories" on public.story_projects
  for delete using (auth.uid() = owner_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists story_projects_touch_updated_at on public.story_projects;
create trigger story_projects_touch_updated_at
before update on public.story_projects
for each row execute function public.touch_updated_at();
