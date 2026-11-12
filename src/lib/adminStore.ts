import { supabase } from "./supabase";

/*
 * Small store for admin-only lists (agenda, financeiro, mensagens).
 * Uses the Supabase table when it exists, so data shows on every device; otherwise
 * this browser. When the table appears, rows written locally are uploaded once.
 */

export interface Row { id: string; created_at: string }

const readLocal = <T,>(key: string): T[] => {
  try { return JSON.parse(localStorage.getItem(key) || "[]") as T[]; } catch { return []; }
};
const writeLocal = (key: string, list: unknown[]) => {
  try { localStorage.setItem(key, JSON.stringify(list)); } catch { /* blocked or full */ }
};

export const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function createStore<T extends Row>(table: string) {
  const key = `gofocus_${table}`;
  let mode: "remote" | "local" | null = null;

  async function detect(): Promise<"remote" | "local"> {
    if (mode) return mode;
    try {
      const { error } = await supabase.from(table).select("id").limit(1);
      mode = error ? "local" : "remote";
    } catch {
      mode = "local";
    }
    if (mode === "remote") {
      const pending = readLocal<T>(key);
      if (pending.length) {
        const { error } = await supabase.from(table).upsert(pending);
        if (!error) localStorage.removeItem(key);
      }
    }
    return mode;
  }

  return {
    detect,
    async list(): Promise<T[]> {
      if ((await detect()) === "remote") {
        const { data, error } = await supabase.from(table).select("*");
        if (!error && data) return data as T[];
      }
      return readLocal<T>(key);
    },
    async save(row: T): Promise<T> {
      if ((await detect()) === "remote") {
        const { error } = await supabase.from(table).upsert(row);
        if (error) throw new Error(error.message);
        return row;
      }
      writeLocal(key, [row, ...readLocal<T>(key).filter((r) => r.id !== row.id)]);
      return row;
    },
    async saveMany(rows: T[]): Promise<void> {
      if (!rows.length) return;
      if ((await detect()) === "remote") {
        const { error } = await supabase.from(table).upsert(rows);
        if (error) throw new Error(error.message);
        return;
      }
      const ids = new Set(rows.map((r) => r.id));
      writeLocal(key, [...rows, ...readLocal<T>(key).filter((r) => !ids.has(r.id))]);
    },
    async remove(id: string): Promise<void> {
      if ((await detect()) === "remote") {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw new Error(error.message);
        return;
      }
      writeLocal(key, readLocal<T>(key).filter((r) => r.id !== id));
    },
  };
}

/* ── Agenda ── */
export type CompromissoTipo = "evento" | "ensaio" | "entrega" | "reuniao" | "outro";
export interface Compromisso extends Row {
  titulo: string;
  data: string; // yyyy-mm-dd
  hora: string | null; // hh:mm
  tipo: CompromissoTipo;
  local: string | null;
  cliente: string | null;
  notas: string | null;
  concluido: boolean;
}
export const agendaStore = createStore<Compromisso>("agenda");

/* ── Financeiro ── */
export interface Lancamento extends Row {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  data: string; // yyyy-mm-dd
  categoria: string;
  status: "pago" | "pendente";
  cliente: string | null;
}
export const financeiroStore = createStore<Lancamento>("financeiro");

/* ── Mensagens prontas ── */
export interface Mensagem extends Row {
  titulo: string;
  texto: string;
  categoria: string;
}
export const mensagensStore = createStore<Mensagem>("mensagens");

/* ── Página de links: Instagram posts/reels shown on /links ── */
export interface LinkDestaque extends Row {
  url: string;
  titulo: string | null;
  ordem: number;
  ativo: boolean;
}
export const destaquesStore = createStore<LinkDestaque>("links_destaques");

/** Instagram post/reel URL → its embed URL, or null if it isn't one. */
export function instagramEmbed(url: string): { embed: string; kind: "reel" | "post" } | null {
  const m = url.trim().match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (!m) return null;
  const tipo = m[1].toLowerCase();
  const kind = tipo === "p" ? "post" : "reel";
  return { embed: `https://www.instagram.com/${tipo === "p" ? "p" : "reel"}/${m[2]}/embed/`, kind };
}

export const PAINEL_SQL = `-- GoFocus: Agenda, Financeiro e Mensagens prontas (cole no Supabase > SQL Editor e clique em Run)
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
`;
