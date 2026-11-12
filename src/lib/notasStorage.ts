import { supabase } from "./supabase";

/*
 * Admin notes, organised in folders.
 * Saved in Supabase (tables `notas` and `notas_pastas`) when those tables exist, so they
 * show on every device; otherwise in this browser. When the tables appear, notes written
 * locally are uploaded once and the local copy is cleared.
 */

export type NotaCor = "nenhuma" | "amarelo" | "verde" | "azul" | "rosa" | "roxo";

export interface Nota {
  id: string;
  titulo: string;
  conteudo: string;
  pasta_id: string | null;
  cor: NotaCor;
  fixada: boolean;
  created_at: string;
  updated_at: string;
}

export interface Pasta {
  id: string;
  nome: string;
  created_at: string;
}

export const NOTAS_SQL = `-- GoFocus: anotações do painel (cole no Supabase > SQL Editor e clique em Run)
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
`;

const LOCAL_NOTAS = "gofocus_notas";
const LOCAL_PASTAS = "gofocus_notas_pastas";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readLocal = <T,>(key: string): T[] => {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
};
const writeLocal = (key: string, list: unknown[]) => {
  try {
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    /* storage full or blocked: nothing else to do */
  }
};

let mode: "remote" | "local" | null = null;

/** Remote when the tables exist and answer; local otherwise. Decided once per session. */
export async function notasMode(): Promise<"remote" | "local"> {
  if (mode) return mode;
  try {
    const { error } = await supabase.from("notas").select("id").limit(1);
    mode = error ? "local" : "remote";
  } catch {
    mode = "local";
  }
  if (mode === "remote") await uploadLocalOnce();
  return mode;
}

/** Notes written before the tables existed go up to Supabase, then leave this browser. */
async function uploadLocalOnce() {
  const pastas = readLocal<Pasta>(LOCAL_PASTAS);
  const notas = readLocal<Nota>(LOCAL_NOTAS);
  if (!pastas.length && !notas.length) return;
  try {
    if (pastas.length) {
      const { error } = await supabase.from("notas_pastas").upsert(pastas);
      if (error) return;
    }
    if (notas.length) {
      const { error } = await supabase.from("notas").upsert(notas);
      if (error) return;
    }
    localStorage.removeItem(LOCAL_PASTAS);
    localStorage.removeItem(LOCAL_NOTAS);
  } catch {
    /* keep the local copy; try again next session */
  }
}

const byPinThenDate = (a: Nota, b: Nota) =>
  Number(b.fixada) - Number(a.fixada) || +new Date(b.updated_at) - +new Date(a.updated_at);

export async function getNotas(): Promise<Nota[]> {
  if ((await notasMode()) === "remote") {
    const { data, error } = await supabase.from("notas").select("*");
    if (!error && data) return (data as Nota[]).sort(byPinThenDate);
  }
  return readLocal<Nota>(LOCAL_NOTAS).sort(byPinThenDate);
}

export async function getPastas(): Promise<Pasta[]> {
  if ((await notasMode()) === "remote") {
    const { data, error } = await supabase.from("notas_pastas").select("*").order("created_at");
    if (!error && data) return data as Pasta[];
  }
  return readLocal<Pasta>(LOCAL_PASTAS).sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
}

export function novaNota(pasta_id: string | null): Nota {
  const now = new Date().toISOString();
  return { id: uid(), titulo: "", conteudo: "", pasta_id, cor: "nenhuma", fixada: false, created_at: now, updated_at: now };
}

/** Create or update a note. Returns the saved note (with a fresh updated_at). */
export async function saveNota(nota: Nota): Promise<Nota> {
  const saved = { ...nota, updated_at: new Date().toISOString() };
  if ((await notasMode()) === "remote") {
    const { error } = await supabase.from("notas").upsert(saved);
    if (error) throw new Error(error.message);
    return saved;
  }
  const list = readLocal<Nota>(LOCAL_NOTAS).filter((n) => n.id !== saved.id);
  writeLocal(LOCAL_NOTAS, [saved, ...list]);
  return saved;
}

export async function deleteNota(id: string): Promise<void> {
  if ((await notasMode()) === "remote") {
    const { error } = await supabase.from("notas").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(LOCAL_NOTAS, readLocal<Nota>(LOCAL_NOTAS).filter((n) => n.id !== id));
}

export async function savePasta(pasta: Pasta): Promise<Pasta> {
  if ((await notasMode()) === "remote") {
    const { error } = await supabase.from("notas_pastas").upsert(pasta);
    if (error) throw new Error(error.message);
    return pasta;
  }
  const list = readLocal<Pasta>(LOCAL_PASTAS).filter((p) => p.id !== pasta.id);
  writeLocal(LOCAL_PASTAS, [...list, pasta]);
  return pasta;
}

export function novaPasta(nome: string): Pasta {
  return { id: uid(), nome, created_at: new Date().toISOString() };
}

/** Deletes the folder; its notes stay, without a folder. */
export async function deletePasta(id: string): Promise<void> {
  if ((await notasMode()) === "remote") {
    const { error } = await supabase.from("notas_pastas").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return;
  }
  writeLocal(LOCAL_PASTAS, readLocal<Pasta>(LOCAL_PASTAS).filter((p) => p.id !== id));
  writeLocal(
    LOCAL_NOTAS,
    readLocal<Nota>(LOCAL_NOTAS).map((n) => (n.pasta_id === id ? { ...n, pasta_id: null } : n))
  );
}
