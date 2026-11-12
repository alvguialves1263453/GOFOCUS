-- GoFocus: anotações do painel (cole no Supabase > SQL Editor e clique em Run)
create table if not exists public.notas_pastas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null default '',
  conteudo text not null default '',
  pasta_id uuid references public.notas_pastas(id) on delete set null,
  cor text not null default 'nenhuma',
  fixada boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notas enable row level security;
alter table public.notas_pastas enable row level security;

drop policy if exists "admin notas" on public.notas;
create policy "admin notas" on public.notas for all to authenticated using (true) with check (true);

drop policy if exists "admin notas_pastas" on public.notas_pastas;
create policy "admin notas_pastas" on public.notas_pastas for all to authenticated using (true) with check (true);
