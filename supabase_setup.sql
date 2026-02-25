-- Criar a tabela de projetos
create table projects (
  id uuid primary key,
  "clientName" text not null,
  slug text not null unique,
  photos jsonb default '[]'::jsonb,
  "createdAt" timestamp with time zone default now(),
  featured boolean default false,
  "coverIndex" integer default 0
);

-- Habilitar segurança de linha (Row Level Security)
alter table projects enable row level security;

-- Permitir leitura pública para todos
create policy "Acesso de leitura público" 
  on projects for select 
  using (true);

-- Permitir que você gerencie os projetos (via anon key)
create policy "Acesso total anon" 
  on projects for all 
  using (true);
