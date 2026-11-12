-- GoFocus: Agenda, Financeiro e Mensagens prontas (cole no Supabase > SQL Editor e clique em Run)
create table if not exists public.agenda (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  data date not null,
  hora text,
  tipo text not null default 'outro',
  local text,
  cliente text,
  notas text,
  concluido boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.financeiro (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('entrada', 'saida')),
  descricao text not null,
  valor numeric(12,2) not null default 0,
  data date not null,
  categoria text not null default 'Outros',
  status text not null default 'pago' check (status in ('pago', 'pendente')),
  cliente text,
  created_at timestamptz not null default now()
);

create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  texto text not null,
  categoria text not null default 'Geral',
  created_at timestamptz not null default now()
);

alter table public.agenda enable row level security;
alter table public.financeiro enable row level security;
alter table public.mensagens enable row level security;

drop policy if exists "admin agenda" on public.agenda;
create policy "admin agenda" on public.agenda for all to authenticated using (true) with check (true);
drop policy if exists "admin financeiro" on public.financeiro;
create policy "admin financeiro" on public.financeiro for all to authenticated using (true) with check (true);
drop policy if exists "admin mensagens" on public.mensagens;
create policy "admin mensagens" on public.mensagens for all to authenticated using (true) with check (true);

-- Página de links: vídeos e posts em destaque (visitantes só leem os ativos)
create table if not exists public.links_destaques (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  titulo text,
  ordem integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.links_destaques enable row level security;
drop policy if exists "publico ve destaques" on public.links_destaques;
create policy "publico ve destaques" on public.links_destaques for select to anon, authenticated using (ativo or auth.role() = 'authenticated');
drop policy if exists "admin destaques" on public.links_destaques;
create policy "admin destaques" on public.links_destaques for all to authenticated using (true) with check (true);
