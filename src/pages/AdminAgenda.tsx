import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarPlus, Check, ChevronLeft, ChevronRight, Clock, ExternalLink, MapPin, MoreHorizontal, Pencil, Plus, Trash2, User,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getInstagramClients, type InstagramClient } from "@/lib/instagram";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { formatarValor } from "@/data/servicos";
import { PAINEL_SQL, agendaStore, newId, type Compromisso, type CompromissoTipo } from "@/lib/adminStore";
import { AdminPage, Field, LocalOnlyNotice, Segmented } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* Everything with a date, from every corner of the panel. */
type Fonte = CompromissoTipo | "tarefa" | "proposta" | "cobranca" | "galeria";
interface Item {
  id: string;
  fonte: Fonte;
  titulo: string;
  data: string; // yyyy-mm-dd
  hora?: string | null;
  sub?: string | null;
  href?: string;
  concluido?: boolean;
  proprio?: Compromisso;
}

/* Type colours: categorical slots, dark steps. Always shown next to their label. */
const FONTES: Record<Fonte, { label: string; cor: string }> = {
  evento: { label: "Evento", cor: "#3987e5" },
  ensaio: { label: "Ensaio", cor: "#199e70" },
  entrega: { label: "Entrega", cor: "#d95926" },
  reuniao: { label: "Reunião", cor: "#9085e9" },
  outro: { label: "Compromisso", cor: "#9a98a6" },
  galeria: { label: "Galeria de evento", cor: "#3987e5" },
  tarefa: { label: "Tarefa Instagram", cor: "#c98500" },
  proposta: { label: "Proposta vence", cor: "#d55181" },
  cobranca: { label: "Cobrança", cor: "#e66767" },
};
const TIPOS_PROPRIOS: CompromissoTipo[] = ["evento", "ensaio", "entrega", "reuniao", "outro"];
const DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
const EASE = [0.16, 1, 0.3, 1] as const;
const inicial = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseYmd = (s: string) => { const [y, m, d] = s.slice(0, 10).split("-").map(Number); return new Date(y, m - 1, d); };
const hojeYmd = () => ymd(new Date());

const vazio = (data: string): Compromisso => ({
  id: newId(), created_at: new Date().toISOString(), titulo: "", data, hora: null,
  tipo: "evento", local: null, cliente: null, notas: null, concluido: false,
});

export default function AdminAgenda() {
  const navigate = useNavigate();
  const { orcamentos } = useOrcamentos();
  const [proprios, setProprios] = useState<Compromisso[]>([]);
  const [externos, setExternos] = useState<Item[]>([]);
  const [remoto, setRemoto] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [dir, setDir] = useState(1);
  const [dia, setDia] = useState(hojeYmd());
  const [form, setForm] = useState<Compromisso | null>(null);
  const [apagar, setApagar] = useState<Compromisso | null>(null);

  useEffect(() => {
    (async () => {
      const m = await agendaStore.detect();
      setRemoto(m === "remote");
      const [lista, eventos, tarefas, pagamentos, clientes] = await Promise.all([
        agendaStore.list().catch(() => [] as Compromisso[]),
        supabase.from("eventos").select("id, titulo, data_evento, local").not("data_evento", "is", null).then(r => r.data || [], () => []),
        supabase.from("instagram_tasks").select("id, title, due_date, completed, client_id").then(r => r.data || [], () => []),
        supabase.from("instagram_payments").select("id, date, amount, status, client_id").eq("status", "pending").then(r => r.data || [], () => []),
        getInstagramClients().catch(() => [] as InstagramClient[]),
      ]);
      const nomeCliente = (id: string) => clientes.find(c => c.id === id)?.name || "cliente";
      const ext: Item[] = [
        ...(eventos as any[]).map(e => ({
          id: `ev-${e.id}`, fonte: "galeria" as Fonte, titulo: e.titulo, data: String(e.data_evento).slice(0, 10),
          sub: e.local, href: `/admin/eventos/${e.id}`,
        })),
        ...(tarefas as any[]).filter(t => t.due_date).map(t => ({
          id: `tk-${t.id}`, fonte: "tarefa" as Fonte, titulo: t.title, data: String(t.due_date).slice(0, 10),
          sub: nomeCliente(t.client_id), href: `/admin/instagram/cliente/${t.client_id}`, concluido: !!t.completed,
        })),
        ...(pagamentos as any[]).filter(p => p.date).map(p => ({
          id: `pg-${p.id}`, fonte: "cobranca" as Fonte, titulo: `Cobrar ${nomeCliente(p.client_id)}`, data: String(p.date).slice(0, 10),
          sub: formatarValor(Number(p.amount || 0)), href: `/admin/instagram/cliente/${p.client_id}`,
        })),
      ];
      setProprios(lista);
      setExternos(ext);
      setLoaded(true);
    })();
  }, []);

  const itens = useMemo<Item[]>(() => {
    const propostas: Item[] = orcamentos
      .filter(o => o.status === "enviado" && o.created_at)
      .map(o => {
        const fim = new Date(o.created_at); fim.setDate(fim.getDate() + (o.validade || 30));
        return {
          id: `or-${o.id}`, fonte: "proposta" as Fonte, titulo: `Proposta ${o.numero} vence`, data: ymd(fim),
          sub: `${o.cliente_nome} · ${formatarValor(o.valor_final)}`, href: "/admin/orcamentos",
        };
      });
    const meus: Item[] = proprios.map(c => ({
      id: c.id, fonte: c.tipo, titulo: c.titulo, data: c.data, hora: c.hora,
      sub: [c.cliente, c.local].filter(Boolean).join(" · ") || null, concluido: c.concluido, proprio: c,
    }));
    return [...meus, ...externos, ...propostas].sort(
      (a, b) => a.data.localeCompare(b.data) || (a.hora || "99").localeCompare(b.hora || "99")
    );
  }, [proprios, externos, orcamentos]);

  const porDia = useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const it of itens) (map[it.data] ||= []).push(it);
    return map;
  }, [itens]);

  /* Six weeks starting on the Sunday on or before the 1st. */
  const celulas = useMemo(() => {
    const inicio = new Date(mes); inicio.setDate(1 - mes.getDay());
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(inicio); d.setDate(inicio.getDate() + i); return d; });
  }, [mes]);

  const proximos = useMemo(() => {
    const h = hojeYmd();
    const lim = new Date(); lim.setDate(lim.getDate() + 14);
    return itens.filter(i => i.data >= h && i.data <= ymd(lim) && !i.concluido).slice(0, 8);
  }, [itens]);

  const mudarMes = (delta: number) => {
    setDir(delta);
    setMes(m => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };
  const irHoje = () => {
    const d = new Date();
    setDir(d < mes ? -1 : 1);
    setMes(new Date(d.getFullYear(), d.getMonth(), 1));
    setDia(hojeYmd());
  };

  const salvar = async () => {
    if (!form) return;
    if (!form.titulo.trim()) { toast.error("Dê um nome ao compromisso."); return; }
    if (!form.data) { toast.error("Escolha a data."); return; }
    try {
      const saved = await agendaStore.save({ ...form, titulo: form.titulo.trim() });
      setProprios(l => [saved, ...l.filter(x => x.id !== saved.id)]);
      setDia(saved.data);
      const d = parseYmd(saved.data);
      setMes(new Date(d.getFullYear(), d.getMonth(), 1));
      setForm(null);
      toast.success("Compromisso salvo na agenda");
    } catch (e) {
      toast.error(`Não deu para salvar: ${(e as Error).message}`);
    }
  };

  const alternarConcluido = async (c: Compromisso) => {
    const next = { ...c, concluido: !c.concluido };
    setProprios(l => l.map(x => (x.id === c.id ? next : x)));
    try { await agendaStore.save(next); } catch (e) { toast.error((e as Error).message); }
  };

  const confirmarApagar = async () => {
    const c = apagar; setApagar(null);
    if (!c) return;
    try {
      await agendaStore.remove(c.id);
      setProprios(l => l.filter(x => x.id !== c.id));
    } catch (e) { toast.error(`Não deu para apagar: ${(e as Error).message}`); }
  };

  const tituloMes = inicial(mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
  const diaSel = parseYmd(dia);
  const itensDia = porDia[dia] || [];

  const linhaItem = (it: Item, mostrarData = false) => {
    const f = FONTES[it.fonte];
    return (
      <motion.li
        key={it.id}
        layout="position"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -16 }}
        transition={{ duration: 0.28, ease: EASE }}
        className={cn("group flex items-start gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3", it.concluido && "opacity-55")}
      >
        {it.proprio ? (
          <button
            type="button"
            onClick={() => alternarConcluido(it.proprio!)}
            aria-label={it.concluido ? `Marcar ${it.titulo} como pendente` : `Marcar ${it.titulo} como feito`}
            className={cn(
              "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border",
              it.concluido ? "border-transparent bg-white text-[#141318]" : "border-white/35 hover:border-white"
            )}
          >
            {it.concluido && <Check className="h-3 w-3" />}
          </button>
        ) : (
          <span aria-hidden="true" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: f.cor }} />
        )}
        <div className="min-w-0 flex-1">
          <p className={cn("text-[14px] font-medium leading-snug text-white", it.concluido && "line-through decoration-white/40")}>{it.titulo}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              {it.proprio && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: f.cor }} />}
              {f.label}
            </span>
            {mostrarData && <span>{parseYmd(it.data).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" }).replace(/\./g, "")}</span>}
            {it.hora && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{it.hora}</span>}
            {it.sub && <span className="truncate">{it.sub}</span>}
          </p>
        </div>
        {it.proprio ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" aria-label={`Opções de ${it.titulo}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-white">
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onSelect={() => setForm(it.proprio!)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setApagar(it.proprio!)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Apagar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : it.href ? (
          <button type="button" onClick={() => navigate(it.href!)} aria-label={`Abrir ${it.titulo}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-white">
            <ExternalLink className="h-4 w-4" />
          </button>
        ) : null}
      </motion.li>
    );
  };

  return (
    <AdminPage
      title="Agenda"
      description="Eventos, ensaios, entregas e tudo que tem data no painel, num calendário só."
      actions={<Button className="rounded-full" onClick={() => setForm(vazio(dia))}><Plus /> Novo compromisso</Button>}
    >
      {loaded && !remoto && <LocalOnlyNotice sql={PAINEL_SQL} what="Os compromissos estão salvos só neste navegador." />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        {/* ── Calendar ── */}
        <section aria-label="Calendário" className="lg overflow-hidden rounded-[24px] border border-border bg-card p-3 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 px-1">
            <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-white">{tituloMes}</h2>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => mudarMes(-1)} aria-label="Mês anterior"><ChevronLeft /></Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={irHoje}>Hoje</Button>
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => mudarMes(1)} aria-label="Próximo mês"><ChevronRight /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 pb-2 text-center text-[12px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
            {DIAS.map(d => <span key={d}>{d}</span>)}
          </div>
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.div
              key={ymd(mes)}
              custom={dir}
              initial={{ opacity: 0, x: dir * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -40 }}
              transition={{ duration: 0.34, ease: EASE }}
              className="grid grid-cols-7 gap-1"
              role="grid"
            >
              {celulas.map(d => {
                const k = ymd(d);
                const fora = d.getMonth() !== mes.getMonth();
                const lista = porDia[k] || [];
                const sel = k === dia;
                const hoje = k === hojeYmd();
                return (
                  <button
                    key={k}
                    type="button"
                    role="gridcell"
                    aria-selected={sel}
                    aria-label={`${d.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}${lista.length ? `, ${lista.length} ${lista.length === 1 ? "item" : "itens"}` : ""}`}
                    onClick={() => setDia(k)}
                    className={cn(
                      "relative flex min-h-[64px] flex-col items-stretch rounded-[14px] p-1.5 text-left sm:min-h-[96px] sm:p-2",
                      sel ? "bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]" : "hover:bg-white/[0.05]",
                      fora && "opacity-40"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center self-start rounded-full text-[13px] font-medium tabular-nums",
                        hoje ? "bg-white text-[#141318]" : "text-white/85"
                      )}
                    >
                      {d.getDate()}
                    </span>
                    {/* phones: dots; larger: short chips */}
                    <span className="mt-1 flex flex-wrap gap-1 sm:hidden">
                      {lista.slice(0, 4).map(it => <span key={it.id} className="h-1.5 w-1.5 rounded-full" style={{ background: FONTES[it.fonte].cor }} />)}
                    </span>
                    <span className="mt-1 hidden min-w-0 flex-col gap-0.5 sm:flex">
                      {lista.slice(0, 2).map(it => (
                        <span key={it.id} className={cn("flex min-w-0 items-center gap-1.5 text-[11px] leading-tight text-white/80", it.concluido && "line-through opacity-60")}>
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: FONTES[it.fonte].cor }} />
                          <span className="truncate">{it.hora ? `${it.hora} ` : ""}{it.titulo}</span>
                        </span>
                      ))}
                      {lista.length > 2 && <span className="text-[11px] text-muted-foreground">+{lista.length - 2} mais</span>}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          </AnimatePresence>
          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 px-1 text-[12px] text-muted-foreground" aria-label="Legenda">
            {(["evento", "ensaio", "entrega", "reuniao", "tarefa", "proposta", "cobranca"] as Fonte[]).map(f => (
              <li key={f} className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: FONTES[f].cor }} />{FONTES[f].label}</li>
            ))}
          </ul>
        </section>

        {/* ── Day + upcoming ── */}
        <div className="space-y-4">
          <section aria-label="Dia escolhido" className="lg rounded-[24px] border border-border bg-card p-4">
            <div className="mb-3 flex items-start justify-between gap-2 px-1">
              <div>
                <p className="text-[13px] text-muted-foreground">{inicial(diaSel.toLocaleDateString("pt-BR", { weekday: "long" }))}</p>
                <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-white">{diaSel.toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}</h2>
              </div>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setForm(vazio(dia))} aria-label="Novo compromisso neste dia">
                <CalendarPlus /> Adicionar
              </Button>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={dia} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                {itensDia.length === 0 ? (
                  <p className="rounded-[16px] border border-dashed border-white/15 px-4 py-6 text-center text-[14px] text-muted-foreground">Nada marcado neste dia.</p>
                ) : (
                  <ul className="space-y-2"><AnimatePresence initial={false}>{itensDia.map(it => linhaItem(it))}</AnimatePresence></ul>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <section aria-label="Próximos 14 dias" className="lg rounded-[24px] border border-border bg-card p-4">
            <h2 className="mb-3 px-1 text-[16px] font-semibold text-white">Próximos 14 dias</h2>
            {proximos.length === 0 ? (
              <p className="px-1 text-[14px] text-muted-foreground">Nada pela frente. Bom momento para marcar ensaios.</p>
            ) : (
              <ul className="space-y-2"><AnimatePresence initial={false}>{proximos.map(it => linhaItem(it, true))}</AnimatePresence></ul>
            )}
          </section>
        </div>
      </div>

      {/* ── New / edit ── */}
      <Dialog open={!!form} onOpenChange={o => !o && setForm(null)}>
        <DialogContent className="sm:max-w-lg" onOpenAutoFocus={(e) => { e.preventDefault(); window.setTimeout(() => document.getElementById("ag-titulo")?.focus(), 30); }}>
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold">{form && proprios.some(p => p.id === form.id) ? "Editar compromisso" : "Novo compromisso"}</DialogTitle>
            <DialogDescription>Aparece no calendário e na lista de próximos.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <Segmented<CompromissoTipo>
                label="Tipo"
                value={form.tipo}
                onChange={v => setForm({ ...form, tipo: v })}
                options={TIPOS_PROPRIOS.map(t => ({ value: t, label: FONTES[t].label }))}
                className="max-w-full"
              />
              <Field label="O que é" htmlFor="ag-titulo">
                <Input id="ag-titulo" autoFocus value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Aniversário da Helena" onKeyDown={e => e.key === "Enter" && salvar()} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data" htmlFor="ag-data">
                  <Input id="ag-data" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                </Field>
                <Field label="Hora" htmlFor="ag-hora" hint="Opcional">
                  <Input id="ag-hora" type="time" value={form.hora || ""} onChange={e => setForm({ ...form, hora: e.target.value || null })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cliente" htmlFor="ag-cliente">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="ag-cliente" className="pl-9" value={form.cliente || ""} onChange={e => setForm({ ...form, cliente: e.target.value || null })} placeholder="Nome" />
                  </div>
                </Field>
                <Field label="Local" htmlFor="ag-local">
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="ag-local" className="pl-9" value={form.local || ""} onChange={e => setForm({ ...form, local: e.target.value || null })} placeholder="Endereço ou salão" />
                  </div>
                </Field>
              </div>
              <Field label="Observações" htmlFor="ag-notas">
                <Textarea id="ag-notas" rows={2} className="resize-none" value={form.notas || ""} onChange={e => setForm({ ...form, notas: e.target.value || null })} placeholder="Equipamento, contato no local, horário de chegada…" />
              </Field>
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="ghost" className="rounded-full" onClick={() => setForm(null)}>Cancelar</Button>
                <Button className="rounded-full" onClick={salvar}><Check /> Salvar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!apagar} onOpenChange={o => !o && setApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar "{apagar?.titulo}"?</AlertDialogTitle>
            <AlertDialogDescription>Sai da agenda e não dá para desfazer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmarApagar}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}
