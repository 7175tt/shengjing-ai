-- 聲境 AI 正式版：在全新的 Supabase 專案 SQL Editor 執行一次。
create extension if not exists pgcrypto;

create table if not exists public.story_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null default '未命名作品',
  body text not null default '',
  style text not null default '自動判讀',
  cue_sheet jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint story_body_limit check (char_length(body) <= 20000)
);

alter table public.story_projects alter column style set default '自動判讀';

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

-- 自然語音快取：實體音檔放在私人 Storage，資料表只保存索引。
create table if not exists public.narration_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  cache_key text not null,
  provider text not null,
  model text not null,
  voice text not null,
  storage_path text not null,
  source_chars integer not null default 0,
  created_at timestamptz not null default now(),
  unique (owner_id, cache_key)
);

alter table public.narration_assets enable row level security;
drop policy if exists "owners can read narration cache" on public.narration_assets;
create policy "owners can read narration cache" on public.narration_assets
  for select using (auth.uid() = owner_id);

-- Edge Function 以 service_role 維護私人快取索引；登入使用者只能讀取自己的資料。
grant select on table public.narration_assets to authenticated;
grant select, insert, update, delete on table public.narration_assets to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('narration-cache', 'narration-cache', false, 26214400, array['audio/mpeg'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owners can read narration objects" on storage.objects;
create policy "owners can read narration objects" on storage.objects
  for select to authenticated
  using (bucket_id = 'narration-cache' and (storage.foldername(name))[1] = auth.uid()::text);

-- 音樂目錄保存情緒、授權與物件網址。音檔可位於 Supabase Storage 或 Cloudflare R2。
create table if not exists public.music_tracks (
  id text primary key,
  title text not null,
  author text not null,
  object_url text not null,
  object_key text,
  storage_provider text not null default 'supabase' check (storage_provider in ('supabase', 'r2')),
  moods text[] not null default '{}',
  tags text[] not null default '{}',
  license text not null,
  source_url text not null,
  duration_seconds numeric,
  published boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.music_tracks enable row level security;
drop policy if exists "public can read published music" on public.music_tracks;
create policy "public can read published music" on public.music_tracks
  for select using (published = true);

grant usage on schema public to anon, authenticated;
grant select on table public.music_tracks to anon, authenticated;

insert into storage.buckets (id, name, public, allowed_mime_types)
values ('music-library', 'music-library', true, array['audio/mpeg', 'audio/ogg', 'audio/wav'])
on conflict (id) do update set public = excluded.public, allowed_mime_types = excluded.allowed_mime_types;

-- 使用者自有音樂：私人儲存、個人目錄與 GPT Audio 分析結果。
alter table public.music_tracks add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.music_tracks add column if not exists analysis_model text;
alter table public.music_tracks add column if not exists analysis_summary text;
alter table public.music_tracks add column if not exists analysis_status text not null default 'catalog';
alter table public.music_tracks add column if not exists energy numeric;
alter table public.music_tracks add column if not exists valence numeric;

create index if not exists music_tracks_owner_created_idx
  on public.music_tracks(owner_id, created_at desc) where owner_id is not null;

drop policy if exists "owners can read personal music" on public.music_tracks;
create policy "owners can read personal music" on public.music_tracks
  for select to authenticated using (auth.uid() = owner_id);

drop policy if exists "owners can delete personal music" on public.music_tracks;
create policy "owners can delete personal music" on public.music_tracks
  for delete to authenticated using (auth.uid() = owner_id);

grant select, delete on table public.music_tracks to authenticated;
grant select, insert, update, delete on table public.music_tracks to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('user-music', 'user-music', false, 20971520, array['audio/mpeg', 'audio/wav', 'audio/x-wav'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "owners can upload user music" on storage.objects;
create policy "owners can upload user music" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'user-music' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owners can read user music" on storage.objects;
create policy "owners can read user music" on storage.objects
  for select to authenticated
  using (bucket_id = 'user-music' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owners can delete user music" on storage.objects;
create policy "owners can delete user music" on storage.objects
  for delete to authenticated
  using (bucket_id = 'user-music' and (storage.foldername(name))[1] = auth.uid()::text);
