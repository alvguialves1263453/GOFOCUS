import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Check, Copy, Folder, FolderPlus, Inbox, Loader2, MoreHorizontal, NotebookPen,
  Pencil, Pin, PinOff, Plus, Search, Trash2,
} from "lucide-react";
import {
  NOTAS_SQL, deleteNota, deletePasta, getNotas, getPastas, notasMode, novaNota, novaPasta,
  saveNota, savePasta, type Nota, type NotaCor, type Pasta,
} from "@/lib/notasStorage";
import { AdminPage, Segmented } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Filtro = "todas" | "fixadas" | string; // or a folder id

const CORES: { value: NotaCor; label: string; hex: string }[] = [
  { value: "nenhuma", label: "Sem cor", hex: "transparent" },
  { value: "amarelo", label: "Amarelo", hex: "#e8b13a" },
  { value: "verde", label: "Verde", hex: "#3bbe7a" },
  { value: "azul", label: "Azul", hex: "#5b9be6" },
  { value: "rosa", label: "Rosa", hex: "#e87ba4" },
  { value: "roxo", label: "Roxo", hex: "#9085e9" },
];
const corHex = (c: NotaCor) => CORES.find((x) => x.value === c)?.hex ?? "transparent";
const EASE = [0.16, 1, 0.3, 1] as const;

function quando(iso: string) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`;
  const hoje = new Date();
  const ontem = new Date(); ontem.setDate(hoje.getDate() - 1);
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === hoje.toDateString()) return `hoje, ${hora}`;
  if (d.toDateString() === ontem.toDateString()) return `ontem, ${hora}`;
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: d.getFullYear() === hoje.getFullYear() ? undefined : "numeric" }).replace(".", "");
}

const tituloDe = (n: Nota) => n.titulo.trim() || n.conteudo.trim().split("\n")[0]?.slice(0, 60) || "Nota sem título";
const previewDe = (n: Nota) => {
  const corpo = n.titulo.trim() ? n.conteudo : n.conteudo.split("\n").slice(1).join(" ");
  return corpo.replace(/\s+/g, " ").trim() || "Sem texto";
};

export default function AdminNotas() {
  const [notas, setNotas] = useState<Nota[]>([]);
  const [pastas, setPastas] = useState<Pasta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [remoto, setRemoto] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState("");
  const [abertaId, setAbertaId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Nota | null>(null);
  const [salvando, setSalvando] = useState<"idle" | "saving" | "saved">("idle");
  const [novaPastaNome, setNovaPastaNome] = useState<string | null>(null);
  const [renomeando, setRenomeando] = useState<{ id: string; nome: string } | null>(null);
  const [apagarNota, setApagarNota] = useState<Nota | null>(null);
  const [apagarPasta, setApagarPasta] = useState<Pasta | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  const timer = useRef<number | null>(null);
  const pendente = useRef<Nota | null>(null);
  const tituloRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    (async () => {
      const m = await notasMode();
      const [n, p] = await Promise.all([getNotas(), getPastas()]);
      setRemoto(m === "remote");
      setNotas(n);
      setPastas(p);
      setLoaded(true);
      if (n.length && window.matchMedia("(min-width: 1024px)").matches) {
        setAbertaId(n[0].id);
        setDraft(n[0]);
      }
    })();
  }, []);

  /* ── Saving: debounce while typing, flush when leaving a note ── */
  const persist = useCallback(async (nota: Nota) => {
    setSalvando("saving");
    try {
      const saved = await saveNota(nota);
      setNotas((list) => {
        const rest = list.filter((x) => x.id !== saved.id);
        return [saved, ...rest].sort((a, b) => Number(b.fixada) - Number(a.fixada) || +new Date(b.updated_at) - +new Date(a.updated_at));
      });
      setSalvando("saved");
    } catch (e) {
      setSalvando("idle");
      toast.error(`Não deu para salvar a nota: ${(e as Error).message}`);
    }
  }, []);

  const flush = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    if (pendente.current) {
      const n = pendente.current;
      pendente.current = null;
      void persist(n);
    }
  }, [persist]);

  useEffect(() => () => flush(), [flush]);

  const editar = (patch: Partial<Nota>, imediato = false) => {
    if (!draft) return;
    const next = { ...draft, ...patch };
    setDraft(next);
    pendente.current = next;
    if (timer.current) window.clearTimeout(timer.current);
    if (imediato) flush();
    else timer.current = window.setTimeout(flush, 600);
  };

  const abrir = (n: Nota) => {
    flush();
    setAbertaId(n.id);
    setDraft(n);
    setSalvando("idle");
  };

  const criar = async () => {
    flush();
    const pastaId = filtro !== "todas" && filtro !== "fixadas" ? filtro : null;
    const n = novaNota(pastaId);
    if (filtro === "fixadas") n.fixada = true;
    setNotas((list) => [n, ...list]);
    setAbertaId(n.id);
    setDraft(n);
    setBusca("");
    await persist(n);
    window.setTimeout(() => tituloRef.current?.focus(), 60);
  };

  const fecharEditor = () => {
    flush();
    setAbertaId(null);
    setDraft(null);
  };

  /* ── Folders ── */
  const criarPasta = async () => {
    const nome = (novaPastaNome || "").trim();
    if (!nome) { setNovaPastaNome(null); return; }
    try {
      const p = await savePasta(novaPasta(nome));
      setPastas((l) => [...l, p]);
      setFiltro(p.id);
      setNovaPastaNome(null);
    } catch (e) {
      toast.error(`Não deu para criar a pasta: ${(e as Error).message}`);
    }
  };

  const renomearPasta = async () => {
    if (!renomeando) return;
    const nome = renomeando.nome.trim();
    const atual = pastas.find((p) => p.id === renomeando.id);
    setRenomeando(null);
    if (!atual || !nome || nome === atual.nome) return;
    try {
      const p = await savePasta({ ...atual, nome });
      setPastas((l) => l.map((x) => (x.id === p.id ? p : x)));
    } catch (e) {
      toast.error(`Não deu para renomear: ${(e as Error).message}`);
    }
  };

  const confirmarApagarPasta = async () => {
    const p = apagarPasta;
    setApagarPasta(null);
    if (!p) return;
    try {
      await deletePasta(p.id);
      setPastas((l) => l.filter((x) => x.id !== p.id));
      setNotas((l) => l.map((n) => (n.pasta_id === p.id ? { ...n, pasta_id: null } : n)));
      if (draft?.pasta_id === p.id) setDraft({ ...draft, pasta_id: null });
      if (filtro === p.id) setFiltro("todas");
      toast.success(`Pasta "${p.nome}" apagada. As notas dela continuam em Todas as notas.`);
    } catch (e) {
      toast.error(`Não deu para apagar a pasta: ${(e as Error).message}`);
    }
  };

  const confirmarApagarNota = async () => {
    const n = apagarNota;
    setApagarNota(null);
    if (!n) return;
    if (pendente.current?.id === n.id) { pendente.current = null; if (timer.current) window.clearTimeout(timer.current); }
    try {
      await deleteNota(n.id);
      const rest = notas.filter((x) => x.id !== n.id);
      setNotas(rest);
      if (abertaId === n.id) {
        const next = isDesktop ? rest.find((x) => visivel(x)) : undefined;
        setAbertaId(next?.id ?? null);
        setDraft(next ?? null);
      }
    } catch (e) {
      toast.error(`Não deu para apagar a nota: ${(e as Error).message}`);
    }
  };

  /* ── What the list shows ── */
  const comDraft = useMemo(
    () => (draft ? notas.map((n) => (n.id === draft.id ? draft : n)) : notas),
    [notas, draft]
  );
  const visivel = (n: Nota) => {
    if (filtro === "fixadas" && !n.fixada) return false;
    if (filtro !== "todas" && filtro !== "fixadas" && n.pasta_id !== filtro) return false;
    if (busca.trim()) {
      const q = busca.toLowerCase();
      return n.titulo.toLowerCase().includes(q) || n.conteudo.toLowerCase().includes(q);
    }
    return true;
  };
  const lista = comDraft.filter(visivel);
  const contagem = (f: Filtro) =>
    f === "todas" ? notas.length : f === "fixadas" ? notas.filter((n) => n.fixada).length : notas.filter((n) => n.pasta_id === f).length;
  const nomeFiltro =
    filtro === "todas" ? "Todas as notas" : filtro === "fixadas" ? "Fixadas" : pastas.find((p) => p.id === filtro)?.nome ?? "Pasta";

  /* ── Pieces ── */
  const pastaItem = (f: Filtro, label: string, icon: ReactNode, pasta?: Pasta) => {
    const ativo = filtro === f;
    if (pasta && renomeando?.id === pasta.id) {
      return (
        <li key={f}>
          <Input
            autoFocus
            value={renomeando.nome}
            onChange={(e) => setRenomeando({ id: pasta.id, nome: e.target.value })}
            onBlur={renomearPasta}
            onKeyDown={(e) => { if (e.key === "Enter") renomearPasta(); if (e.key === "Escape") setRenomeando(null); }}
            aria-label="Novo nome da pasta"
            className="h-10 rounded-xl"
          />
        </li>
      );
    }
    return (
      <li key={f} className="group relative">
        <button
          type="button"
          onClick={() => setFiltro(f)}
          aria-current={ativo ? "true" : undefined}
          className={cn(
            "relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] font-medium",
            ativo ? "text-white" : "text-white/60 hover:bg-white/[0.05] hover:text-white"
          )}
        >
          {ativo && (
            <motion.span
              layoutId="notas-pasta-ativa"
              aria-hidden="true"
              className="liquid-pill-dark absolute inset-0 rounded-xl"
              transition={{ type: "spring", stiffness: 520, damping: 40 }}
            />
          )}
          <span className="relative [&_svg]:h-4 [&_svg]:w-4">{icon}</span>
          <span className="relative min-w-0 flex-1 truncate">{label}</span>
          <span className={cn("relative text-[12px] tabular-nums text-muted-foreground", pasta && "group-hover:opacity-0")}>{contagem(f)}</span>
        </button>
        {pasta && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Opções da pasta ${pasta.nome}`}
                className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground opacity-0 hover:bg-white/10 hover:text-white focus-visible:opacity-100 group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => setRenomeando({ id: pasta.id, nome: pasta.nome })}>
                <Pencil className="mr-2 h-4 w-4" /> Renomear
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setApagarPasta(pasta)} className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Apagar pasta
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </li>
    );
  };

  const colunaPastas = (
    <nav aria-label="Pastas de notas" className="lg flex flex-col rounded-[22px] border border-border bg-card p-2.5">
      <ul className="space-y-0.5">
        {pastaItem("todas", "Todas as notas", <Inbox />)}
        {pastaItem("fixadas", "Fixadas", <Pin />)}
      </ul>
      <div className="mx-3 my-2.5 h-px bg-white/[0.08]" />
      <p className="px-3 pb-1.5 text-[12px] font-medium text-muted-foreground">Pastas</p>
      <ul className="space-y-0.5">
        <AnimatePresence initial={false}>
          {pastas.map((p) => (
            <motion.div key={p.id} layout="position" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}>
              {pastaItem(p.id, p.nome, <Folder />, p)}
            </motion.div>
          ))}
        </AnimatePresence>
        {novaPastaNome !== null ? (
          <li className="pt-1">
            <Input
              autoFocus
              value={novaPastaNome}
              placeholder="Nome da pasta"
              onChange={(e) => setNovaPastaNome(e.target.value)}
              onBlur={criarPasta}
              onKeyDown={(e) => { if (e.key === "Enter") criarPasta(); if (e.key === "Escape") setNovaPastaNome(null); }}
              aria-label="Nome da nova pasta"
              className="h-10 rounded-xl"
            />
          </li>
        ) : (
          <li>
            <button
              type="button"
              onClick={() => setNovaPastaNome("")}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[14px] text-muted-foreground hover:bg-white/[0.05] hover:text-white"
            >
              <FolderPlus className="h-4 w-4" /> Nova pasta
            </button>
          </li>
        )}
      </ul>
    </nav>
  );

  const colunaLista = (
    <section aria-label={nomeFiltro} className="lg flex min-h-0 flex-col rounded-[22px] border border-border bg-card">
      <div className="space-y-3 p-3 pb-2">
        <div className="flex items-center justify-between gap-2 px-1 pt-1">
          <h2 className="truncate text-[16px] font-semibold text-white">{nomeFiltro}</h2>
          <span className="text-[13px] tabular-nums text-muted-foreground">{lista.length}</span>
        </div>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar nas notas"
            aria-label="Buscar nas notas"
            className="h-10 rounded-full pl-9"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {!loaded ? (
          <div className="space-y-2 p-1" aria-busy="true">
            {[0, 1, 2].map((i) => <div key={i} className="h-[74px] animate-pulse rounded-[16px] bg-white/[0.04]" />)}
          </div>
        ) : lista.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[15px] font-medium text-white">{busca ? "Nada encontrado" : "Nenhuma nota aqui"}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{busca ? "Tente outra palavra." : "Crie a primeira com o botão Nova nota."}</p>
          </div>
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {lista.map((n) => {
                const ativa = n.id === abertaId;
                return (
                  <motion.li
                    key={n.id}
                    layout="position"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -24, transition: { duration: 0.18 } }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <button
                      type="button"
                      onClick={() => abrir(n)}
                      aria-current={ativa ? "true" : undefined}
                      className={cn(
                        "relative w-full rounded-[16px] px-3.5 py-3 text-left",
                        ativa ? "bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]" : "hover:bg-white/[0.05]"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        {n.cor !== "nenhuma" && <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full" style={{ background: corHex(n.cor) }} />}
                        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-white">{tituloDe(n)}</span>
                        {n.fixada && <Pin className="h-3.5 w-3.5 shrink-0 text-white/60" aria-label="Fixada" />}
                      </span>
                      <span className="mt-1 flex gap-2 text-[13px]">
                        <span className="shrink-0 tabular-nums text-white/55">{quando(n.updated_at)}</span>
                        <span className="min-w-0 truncate text-muted-foreground">{previewDe(n)}</span>
                      </span>
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );

  const editor = draft ? (
    <motion.article
      key={draft.id}
      initial={{ opacity: 0, x: isDesktop ? 0 : 40, y: isDesktop ? 8 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: isDesktop ? 0 : 40 }}
      transition={{ duration: 0.32, ease: EASE }}
      className="lg flex min-h-0 flex-col rounded-[22px] border border-border bg-card"
      aria-label="Nota aberta"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] px-3 py-2.5 sm:px-4">
        {!isDesktop && (
          <Button variant="ghost" size="sm" className="rounded-full" onClick={fecharEditor}>
            <ArrowLeft /> Notas
          </Button>
        )}
        <Select value={draft.pasta_id ?? "sem"} onValueChange={(v) => editar({ pasta_id: v === "sem" ? null : v }, true)}>
          <SelectTrigger aria-label="Pasta da nota" className="h-9 w-auto min-w-[140px] rounded-full text-[13px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sem">Sem pasta</SelectItem>
            {pastas.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <div role="radiogroup" aria-label="Cor da nota" className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-black/20 px-1.5 py-1">
          {CORES.map((c) => {
            const on = draft.cor === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={c.label}
                title={c.label}
                onClick={() => editar({ cor: c.value }, true)}
                className={cn(
                  "grid h-6 w-6 place-items-center rounded-full",
                  on ? "ring-2 ring-white/80 ring-offset-1 ring-offset-[#2a2930]" : "hover:scale-110"
                )}
              >
                <span
                  className={cn("h-3.5 w-3.5 rounded-full", c.value === "nenhuma" && "border border-white/40")}
                  style={{ background: c.hex }}
                />
              </button>
            );
          })}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground" aria-live="polite">
            {salvando === "saving" ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Salvando</> : salvando === "saved" ? <><Check className="h-3.5 w-3.5" /> Salvo</> : null}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => editar({ fixada: !draft.fixada }, true)}
            aria-label={draft.fixada ? "Desafixar nota" : "Fixar nota no topo"}
            aria-pressed={draft.fixada}
            title={draft.fixada ? "Desafixar" : "Fixar no topo"}
          >
            {draft.fixada ? <PinOff /> : <Pin />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            title="Copiar texto"
            aria-label="Copiar o texto da nota"
            onClick={() => { navigator.clipboard?.writeText(`${draft.titulo}\n\n${draft.conteudo}`.trim()); toast.success("Texto copiado"); }}
          >
            <Copy />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive"
            onClick={() => setApagarNota(draft)}
            aria-label="Apagar nota"
            title="Apagar nota"
          >
            <Trash2 />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-6 sm:px-8">
        <p className="mb-3 text-center text-[12px] text-muted-foreground">
          {new Date(draft.updated_at).toLocaleString("pt-BR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
        <input
          ref={tituloRef}
          value={draft.titulo}
          onChange={(e) => editar({ titulo: e.target.value })}
          placeholder="Título"
          aria-label="Título da nota"
          className="w-full border-0 bg-transparent p-0 text-[26px] font-semibold leading-tight tracking-[-0.02em] text-white placeholder:text-white/25 focus:outline-none focus-visible:outline-none"
          style={{ boxShadow: "none", background: "transparent" }}
        />
        <AutoTextarea
          value={draft.conteudo}
          onChange={(v) => editar({ conteudo: v })}
          placeholder="Escreva aqui… ideias, pautas, contatos, roteiro do evento."
        />
      </div>
    </motion.article>
  ) : (
    <section className="lg grid min-h-0 place-items-center rounded-[22px] border border-border bg-card p-8 text-center">
      <div>
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-white/[0.07] text-muted-foreground">
          <NotebookPen className="h-6 w-6" />
        </div>
        <p className="text-[16px] font-semibold text-white">Escolha uma nota</p>
        <p className="mt-1 text-[14px] text-muted-foreground">Ou crie uma nova para começar a escrever.</p>
        <Button className="mt-5 rounded-full" onClick={criar}><Plus /> Nova nota</Button>
      </div>
    </section>
  );

  return (
    <AdminPage
      title="Anotações"
      description="Ideias, pautas, contatos e lembretes, separados por pasta."
      actions={<Button className="rounded-full" onClick={criar}><Plus /> Nova nota</Button>}
    >
      {loaded && !remoto && <AvisoSync />}

      {isDesktop ? (
        <div className="grid h-[calc(100vh-11rem)] min-h-[520px] grid-cols-[220px_320px_minmax(0,1fr)] gap-3">
          {colunaPastas}
          {colunaLista}
          <AnimatePresence mode="wait">{editor}</AnimatePresence>
        </div>
      ) : (
        <div className="space-y-3">
          <Segmented<string>
            label="Pasta"
            value={filtro}
            onChange={setFiltro}
            options={[
              { value: "todas", label: "Todas", count: contagem("todas") },
              { value: "fixadas", label: "Fixadas", count: contagem("fixadas") },
              ...pastas.map((p) => ({ value: p.id, label: p.nome, count: contagem(p.id) })),
            ]}
            className="max-w-full"
          />
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => setNovaPastaNome("")}>
              <FolderPlus /> Nova pasta
            </Button>
            {filtro !== "todas" && filtro !== "fixadas" && (
              <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={() => { const p = pastas.find((x) => x.id === filtro); if (p) setApagarPasta(p); }}>
                <Trash2 /> Apagar pasta
              </Button>
            )}
          </div>
          {novaPastaNome !== null && (
            <Input
              autoFocus
              value={novaPastaNome}
              placeholder="Nome da pasta"
              onChange={(e) => setNovaPastaNome(e.target.value)}
              onBlur={criarPasta}
              onKeyDown={(e) => { if (e.key === "Enter") criarPasta(); if (e.key === "Escape") setNovaPastaNome(null); }}
              aria-label="Nome da nova pasta"
              className="h-11 rounded-full"
            />
          )}
          <div className="h-[calc(100dvh-17rem)] min-h-[360px]">{colunaLista}</div>
          <AnimatePresence>
            {draft && (
              <div className="fixed inset-0 z-50 flex flex-col bg-[#1f1e24] p-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
                {editor}
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AlertDialog open={!!apagarNota} onOpenChange={(o) => !o && setApagarNota(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar "{apagarNota ? tituloDe(apagarNota) : ""}"?</AlertDialogTitle>
            <AlertDialogDescription>A nota será apagada e não dá para desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmarApagarNota}>
              Apagar nota
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!apagarPasta} onOpenChange={(o) => !o && setApagarPasta(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar a pasta "{apagarPasta?.nome}"?</AlertDialogTitle>
            <AlertDialogDescription>
              As notas dela não são apagadas: continuam em Todas as notas, sem pasta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmarApagarPasta}>
              Apagar pasta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}

/** Text area that grows with its text, borderless, for the note body. */
function AutoTextarea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.max(240, el.scrollHeight)}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label="Texto da nota"
      className="mt-4 w-full resize-none border-0 bg-transparent p-0 text-[16px] leading-[1.7] text-white/90 placeholder:text-white/25 focus:outline-none focus-visible:outline-none"
      style={{ boxShadow: "none", background: "transparent" }}
    />
  );
}

/** Shown while notes live only in this browser: one step to sync them everywhere. */
function AvisoSync() {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="lg mb-4 flex flex-col gap-3 rounded-[18px] border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-[14px] font-medium text-white">As notas estão salvas só neste navegador.</p>
        <p className="text-[13px] text-muted-foreground">
          Para ver as mesmas notas no celular, cole o comando no Supabase (SQL Editor) uma vez. As notas que já existem sobem sozinhas.
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 rounded-full"
        onClick={() => { navigator.clipboard?.writeText(NOTAS_SQL); setCopiado(true); toast.success("Comando copiado. Cole no SQL Editor do Supabase e clique em Run."); }}
      >
        {copiado ? <Check /> : <Copy />} {copiado ? "Copiado" : "Copiar comando"}
      </Button>
    </div>
  );
}
