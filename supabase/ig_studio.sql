-- ============================================================
-- GoFocus Instagram Studio - Schema Supabase
-- Cole e execute este script no SQL Editor do seu projeto Supabase.
-- ============================================================

-- 1. Contas Profissionais do Instagram conectadas via OAuth Meta
create table if not exists public.ig_connected_accounts (
  id uuid primary key default gen_random_uuid(),
  ig_user_id text unique not null,
  username text not null,
  name text not null default '',
  profile_picture_url text default '',
  biography text default '',
  followers_count integer default 0,
  follows_count integer default 0,
  media_count integer default 0,
  access_token text not null,
  token_expires_at timestamptz,
  page_id text,
  page_name text,
  is_active boolean default true,
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Fila de postagens agendadas / publicadas (suporte multi-contas)
create table if not exists public.ig_scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  media_type text not null check (media_type in ('IMAGE', 'CAROUSEL', 'REELS', 'STORIES')),
  media_urls jsonb not null default '[]'::jsonb,
  cover_url text,
  caption text not null default '',
  hashtags text not null default '',
  music_name text default '',
  music_url text default '',
  location_name text default '',
  scheduled_for timestamptz not null,
  target_account_ids uuid[] not null default '{}',
  status text not null default 'agendado' check (
    status in ('rascunho', 'agendado', 'publicando', 'publicado', 'erro', 'lembrete_musica')
  ),
  publish_results jsonb not null default '[]'::jsonb,
  error_message text,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ig_scheduled_posts_due
  on public.ig_scheduled_posts (status, scheduled_for);

-- 3. Grupos de Hashtags reutilizáveis
create table if not exists public.ig_hashtag_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tags text not null,
  created_at timestamptz default now()
);

-- Habilita RLS (Row Level Security)
alter table public.ig_connected_accounts enable row level security;
alter table public.ig_scheduled_posts enable row level security;
alter table public.ig_hashtag_groups enable row level security;

-- Políticas: usuários autenticados no painel admin podem gerenciar tudo
do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'ig_connected_accounts' and policyname = 'auth_all_ig_accounts'
  ) then
    create policy auth_all_ig_accounts on public.ig_connected_accounts
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'ig_scheduled_posts' and policyname = 'auth_all_ig_scheduled'
  ) then
    create policy auth_all_ig_scheduled on public.ig_scheduled_posts
      for all to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'ig_hashtag_groups' and policyname = 'auth_all_ig_hashtags'
  ) then
    create policy auth_all_ig_hashtags on public.ig_hashtag_groups
      for all to authenticated using (true) with check (true);
  end if;
end $$;

-- Grupos iniciais de hashtags da GoFocus
insert into public.ig_hashtag_groups (name, tags)
select * from (values
  ('Filmmaking & Comercial', '#videomakeritapeva #producaoaudiovisual #filmmakercomercial #itapevasp #videosparaempresas'),
  ('Fotografia Mobile & Dicas', '#fotografiacomcelular #dicasdefotografia #dicasdegravacao #videomaker #audiovisual'),
  ('Eventos & Cobertura', '#coberturadeeventos #fotografiadeeventos #itapeva #producaodevideo #gofocus')
) as v(name, tags)
where not exists (select 1 from public.ig_hashtag_groups limit 1);
