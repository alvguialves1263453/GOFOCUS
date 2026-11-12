import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  ArrowDownLeft, ArrowUpRight, Check, ChevronLeft, ChevronRight, Clock, Instagram, MoreHorizontal, Pencil, Plus, Receipt, Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getInstagramClients, type InstagramClient } from "@/lib/instagram";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { formatarValor } from "@/data/servicos";
import { PAINEL_SQL, financeiroStore, newId, type Lancamento } from "@/lib/adminStore";
import { AdminPage, Field, LocalOnlyNotice, Segmented, StatusBadge } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* Chart colours: reference palette slots 1-2, dark steps, validated on the admin surface. */
const ENTRADA = "#3987e5";
const SAIDA = "#d95926";
const CAT_ENTRADA = ["Evento", "Ensaio", "Social media", "Tráfego pago", "Design", "Outros"];
const CAT_SAIDA = ["Equipamento", "Transporte", "Software", "Marketing", "Impostos", "Alimentação", "Outros"];
const EASE = [0.16, 1, 0.3, 1] as const;
const inicial = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Filtro = "tudo" | "entrada" | "saida" | "pendente";
interface Linha extends Lancamento { origem: "painel" | "instagram"; editavel: boolean }

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const mesDe = (s: string) => s.slice(0, 7);
const chaveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const curto = (v: number) => (Math.abs(v) >= 1000 ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : `R$ ${Math.round(v)}`);

const vazio = (tipo: "entrada" | "saida", data: string): Lancamento => ({
  id: newId(), created_at: new Date().toISOString(), tipo, descricao: "", valor: 0, data,
  categoria: tipo === "entrada" ? "Evento" : "Equipamento", status: "pago", cliente: null,
});

export default function AdminFinanceiro() {
  const { orcamentos } = useOrcamentos();
  const [proprios, setProprios] = useState<Lancamento[]>([]);
  const [insta, setInsta] = useState<Linha[]>([]);
  const [remoto, setRemoto] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [mes, setMes] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [filtro, setFiltro] = useState<Filtro>("tudo");
  const [form, setForm] = useState<Lancamento | null>(null);
  const [apagar, setApagar] = useState<Lancamento | null>(null);

  useEffect(() => {
    (async () => {
      const m = await financeiroStore.detect();
      setRemoto(m === "remote");
      const [lista, pagamentos, despesas, clientes] = await Promise.all([
        financeiroStore.list().catch(() => [] as Lancamento[]),
        supabase.from("instagram_payments").select("*").then(r => r.data || [], () => []),
        supabase.from("instagram_expenses").select("*").then(r => r.data || [], () => []),
        getInstagramClients().catch(() => [] as InstagramClient[]),
      ]);
      const nome = (id: string) => clientes.find(c => c.id === id)?.name || "Cliente";
      setProprios(lista);
      setInsta([
        ...(pagamentos as any[]).map(p => ({
          id: `ig-p-${p.id}`, created_at: p.date, tipo: "entrada" as const, descricao: `Mensalidade · ${nome(p.client_id)}`,
          valor: Number(p.amount || 0), data: String(p.date).slice(0, 10), categoria: "Social media",
          status: p.status === "paid" ? ("pago" as const) : ("pendente" as const), cliente: nome(p.client_id), origem: "instagram" as const, editavel: false,
        })),
        ...(despesas as any[]).map(e => ({
          id: `ig-e-${e.id}`, created_at: e.date, tipo: "saida" as const, descricao: `${e.description || "Despesa"} · ${nome(e.client_id)}`,
          valor: Number(e.amount || 0), data: String(e.date).slice(0, 10), categoria: e.category || "Outros",
          status: "pago" as const, cliente: nome(e.client_id), origem: "instagram" as const, editavel: false,
        })),
      ]);
      setLoaded(true);
    })();
  }, []);

  const todas = useMemo<Linha[]>(
    () => [...proprios.map(l => ({ ...l, origem: "painel" as const, editavel: true })), ...insta]
      .sort((a, b) => b.data.localeCompare(a.data) || b.created_at.localeCompare(a.created_at)),
    [proprios, insta]
  );

  const chave = chaveMes(mes);
  const doMes = todas.filter(l => mesDe(l.data) === chave);
  const soma = (ls: Linha[]) => ls.reduce((n, l) => n + l.valor, 0);
  const entradas = soma(doMes.filter(l => l.tipo === "entrada" && l.status === "pago"));
  const saidas = soma(doMes.filter(l => l.tipo === "saida" && l.status === "pago"));
  const aReceber = soma(todas.filter(l => l.tipo === "entrada" && l.status === "pendente"));
  const aPagar = soma(todas.filter(l => l.tipo === "saida" && l.status === "pendente"));

  const visiveis = doMes.filter(l =>
    filtro === "tudo" ? true : filtro === "pendente" ? l.status === "pendente" : l.tipo === filtro
  );
  const porDia = visiveis.reduce<Record<string, Linha[]>>((acc, l) => ((acc[l.data] ||= []).push(l), acc), {});

  const grafico = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mes.getFullYear(), mes.getMonth() - (5 - i), 1);
    const k = chaveMes(d);
    const ls = todas.filter(l => mesDe(l.data) === k && l.status === "pago");
    return {
      mes: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
      Entradas: soma(ls.filter(l => l.tipo === "entrada")),
      Saídas: soma(ls.filter(l => l.tipo === "saida")),
    };
  }), [todas, mes]);

  /* Approved proposals with no entry that mentions their number yet. */
  const propostasSemLancamento = orcamentos.filter(
    o => o.status === "aprovado" && !proprios.some(l => l.descricao.includes(o.numero))
  );

  const mudarMes = (delta: number) => setMes(m => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  const hojeNoMes = () => {
    const h = new Date();
    return chaveMes(h) === chave ? ymd(h) : `${chave}-01`;
  };

  const salvar = async () => {
    if (!form) return;
    if (!form.descricao.trim()) { toast.error("Escreva uma descrição."); return; }
    if (!(form.valor > 0)) { toast.error("Coloque um valor maior que zero."); return; }
    try {
      const saved = await financeiroStore.save({ ...form, descricao: form.descricao.trim() });
      setProprios(l => [saved, ...l.filter(x => x.id !== saved.id)]);
      const d = new Date(saved.data + "T12:00:00");
      setMes(new Date(d.getFullYear(), d.getMonth(), 1));
      setForm(null);
      toast.success(saved.tipo === "entrada" ? "Entrada lançada" : "Saída lançada");
    } catch (e) {
      toast.error(`Não deu para salvar: ${(e as Error).message}`);
    }
  };

  const marcarPago = async (l: Lancamento) => {
    const next = { ...l, status: l.status === "pago" ? ("pendente" as const) : ("pago" as const) };
    setProprios(ls => ls.map(x => (x.id === l.id ? next : x)));
    try { await financeiroStore.save(next); } catch (e) { toast.error((e as Error).message); }
  };

  const confirmarApagar = async () => {
    const l = apagar; setApagar(null);
    if (!l) return;
    try { await financeiroStore.remove(l.id); setProprios(ls => ls.filter(x => x.id !== l.id)); }
    catch (e) { toast.error(`Não deu para apagar: ${(e as Error).message}`); }
  };

  const tituloMes = inicial(mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }));
  const saldo = entradas - saidas;
  const catOptions = form?.tipo === "saida" ? CAT_SAIDA : CAT_ENTRADA;

  return (
    <AdminPage
      title="Financeiro"
      description="Entradas e saídas do estúdio, mês a mês."
      actions={
        <>
          <Button variant="outline" className="rounded-full" onClick={() => setForm(vazio("saida", hojeNoMes()))}><ArrowUpRight /> Saída</Button>
          <Button className="rounded-full" onClick={() => setForm(vazio("entrada", hojeNoMes()))}><Plus /> Entrada</Button>
        </>
      }
    >
      {loaded && !remoto && <LocalOnlyNotice sql={PAINEL_SQL} what="Os lançamentos estão salvos só neste navegador." />}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => mudarMes(-1)} aria-label="Mês anterior"><ChevronLeft /></Button>
          <AnimatePresence mode="wait" initial={false}>
            <motion.h2
              key={chave}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="min-w-[170px] text-center text-[20px] font-semibold tracking-[-0.01em] text-white"
            >
              {tituloMes}
            </motion.h2>
          </AnimatePresence>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => mudarMes(1)} aria-label="Próximo mês"><ChevronRight /></Button>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Entrou" value={formatarValor(entradas)} hint="pago neste mês" dot={ENTRADA} />
        <Tile label="Saiu" value={formatarValor(saidas)} hint="pago neste mês" dot={SAIDA} />
        <Tile label="Saldo do mês" value={formatarValor(saldo)} hint={saldo >= 0 ? "sobrou" : "faltou"} strong />
        <Tile label="A receber" value={formatarValor(aReceber)} hint={aPagar > 0 ? `${formatarValor(aPagar)} a pagar` : "pendentes de todos os meses"} />
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
        <section aria-label="Lançamentos do mês" className="lg rounded-[24px] border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-white">Lançamentos</h2>
            <Segmented<Filtro>
              label="Filtrar lançamentos"
              value={filtro}
              onChange={setFiltro}
              options={[
                { value: "tudo", label: "Tudo", count: doMes.length },
                { value: "entrada", label: "Entradas" },
                { value: "saida", label: "Saídas" },
                { value: "pendente", label: "Pendentes" },
              ]}
            />
          </div>
          {!loaded ? (
            <div className="space-y-2" aria-busy="true">{[0, 1, 2].map(i => <div key={i} className="h-14 animate-pulse rounded-[14px] bg-white/[0.04]" />)}</div>
          ) : visiveis.length === 0 ? (
            <div className="rounded-[16px] border border-dashed border-white/15 px-6 py-10 text-center">
              <p className="text-[15px] font-medium text-white">Nada lançado {filtro === "tudo" ? "neste mês" : "com esse filtro"}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">Use Entrada ou Saída no topo para registrar.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(porDia).map(([data, ls]) => (
                <div key={data}>
                  <p className="mb-2 px-1 text-[12px] font-medium text-muted-foreground">
                    {inicial(new Date(data + "T12:00:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" }).replace(".", ""))}
                  </p>
                  <ul className="space-y-1.5">
                    <AnimatePresence initial={false}>
                      {ls.map(l => (
                        <motion.li
                          key={l.id}
                          layout="position"
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -16 }}
                          transition={{ duration: 0.26, ease: EASE }}
                          className="flex items-center gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.035] px-3 py-2.5"
                        >
                          <span
                            aria-hidden="true"
                            className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                            style={{ background: `${l.tipo === "entrada" ? ENTRADA : SAIDA}26`, color: l.tipo === "entrada" ? ENTRADA : SAIDA }}
                          >
                            {l.tipo === "entrada" ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[14px] font-medium text-white">{l.descricao}</p>
                            <p className="flex flex-wrap items-center gap-x-2 text-[12px] text-muted-foreground">
                              <span>{l.tipo === "entrada" ? "Entrada" : "Saída"} · {l.categoria}</span>
                              {l.origem === "instagram" && <span className="inline-flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</span>}
                            </p>
                          </div>
                          {l.status === "pendente" && <StatusBadge tone="warning" className="hidden sm:inline-flex">Pendente</StatusBadge>}
                          <span className={cn("whitespace-nowrap text-right text-[15px] font-semibold tabular-nums", l.status === "pendente" ? "text-white/60" : "text-white")}>
                            {l.tipo === "saida" ? "− " : "+ "}{formatarValor(l.valor)}
                          </span>
                          {l.editavel ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" aria-label={`Opções de ${l.descricao}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-white">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onSelect={() => marcarPago(l)}>
                                  {l.status === "pago" ? <><Clock className="mr-2 h-4 w-4" /> Marcar pendente</> : <><Check className="mr-2 h-4 w-4" /> Marcar como pago</>}
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setForm(l)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => setApagar(l)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Apagar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <span className="w-8 shrink-0" title="Vem dos clientes do Instagram; edite lá." />
                          )}
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="space-y-4">
          <section aria-label="Últimos 6 meses" className="lg rounded-[24px] border border-border bg-card p-4">
            <h2 className="text-[16px] font-semibold text-white">Últimos 6 meses</h2>
            <p className="text-[13px] text-muted-foreground">Só o que já foi pago.</p>
            <div className="mt-3">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={grafico} margin={{ top: 8, right: 0, left: 0, bottom: 0 }} barGap={2} barCategoryGap="26%">
                  <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
                  <XAxis dataKey="mes" stroke="transparent" tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                  <YAxis stroke="transparent" tickLine={false} width={58} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickFormatter={curto} />
                  <Tooltip
                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                    content={({ active, payload, label }) => active && payload?.length ? (
                      <div className="rounded-[12px] border border-white/10 bg-[#2c2a32]/95 px-3 py-2 text-[13px]">
                        <p className="mb-1 text-muted-foreground">{inicial(String(label))}</p>
                        {payload.map(p => (
                          <p key={String(p.name)} className="flex items-center gap-2 text-white">
                            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                            <span className="text-white/75">{p.name}</span>
                            <span className="ml-auto pl-3 font-semibold tabular-nums">{formatarValor(Number(p.value))}</span>
                          </p>
                        ))}
                      </div>
                    ) : null}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, paddingTop: 6 }} />
                  <Bar dataKey="Entradas" fill={ENTRADA} radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={800} />
                  <Bar dataKey="Saídas" fill={SAIDA} radius={[4, 4, 0, 0]} maxBarSize={18} animationDuration={800} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {propostasSemLancamento.length > 0 && (
            <section aria-label="Propostas aprovadas" className="lg rounded-[24px] border border-border bg-card p-4">
              <h2 className="text-[16px] font-semibold text-white">Propostas aprovadas</h2>
              <p className="text-[13px] text-muted-foreground">Ainda não lançadas como entrada.</p>
              <ul className="mt-3 space-y-1.5">
                {propostasSemLancamento.slice(0, 5).map(o => (
                  <li key={o.id} className="flex items-center gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.035] px-3 py-2.5">
                    <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-white">{o.cliente_nome}</p>
                      <p className="text-[12px] tabular-nums text-muted-foreground">{o.numero} · {formatarValor(o.valor_final)}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setForm({ ...vazio("entrada", hojeNoMes()), descricao: `Proposta ${o.numero} · ${o.cliente_nome}`, valor: o.valor_final, cliente: o.cliente_nome, status: "pendente" })}
                    >
                      Lançar
                    </Button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      <Dialog open={!!form} onOpenChange={o => !o && setForm(null)}>
        <DialogContent className="sm:max-w-md" onOpenAutoFocus={(e) => { e.preventDefault(); window.setTimeout(() => document.getElementById("fi-desc")?.focus(), 30); }}>
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold">
              {form && proprios.some(p => p.id === form.id) ? "Editar lançamento" : form?.tipo === "saida" ? "Nova saída" : "Nova entrada"}
            </DialogTitle>
            <DialogDescription>Entra no saldo do mês da data escolhida.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <Segmented<"entrada" | "saida">
                label="Tipo de lançamento"
                value={form.tipo}
                onChange={v => setForm({ ...form, tipo: v, categoria: v === "entrada" ? CAT_ENTRADA[0] : CAT_SAIDA[0] })}
                options={[{ value: "entrada", label: "Entrada" }, { value: "saida", label: "Saída" }]}
              />
              <Field label="Descrição" htmlFor="fi-desc">
                <Input id="fi-desc" autoFocus value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder={form.tipo === "entrada" ? "Ex: Sinal do casamento da Ana" : "Ex: Bateria extra para câmera"} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valor (R$)" htmlFor="fi-valor">
                  <Input id="fi-valor" type="number" inputMode="decimal" min={0} step="0.01" value={form.valor || ""} onChange={e => setForm({ ...form, valor: Number(e.target.value) || 0 })} className="text-right tabular-nums" />
                </Field>
                <Field label="Data" htmlFor="fi-data">
                  <Input id="fi-data" type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Categoria" htmlFor="fi-cat">
                  <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                    <SelectTrigger id="fi-cat"><SelectValue /></SelectTrigger>
                    <SelectContent>{catOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Situação">
                  <Segmented<"pago" | "pendente">
                    label="Situação do pagamento"
                    value={form.status}
                    onChange={v => setForm({ ...form, status: v })}
                    options={[{ value: "pago", label: "Pago" }, { value: "pendente", label: "Pendente" }]}
                  />
                </Field>
              </div>
              <Field label="Cliente ou fornecedor" htmlFor="fi-cli" hint="Opcional">
                <Input id="fi-cli" value={form.cliente || ""} onChange={e => setForm({ ...form, cliente: e.target.value || null })} />
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
            <AlertDialogTitle>Apagar "{apagar?.descricao}"?</AlertDialogTitle>
            <AlertDialogDescription>O lançamento sai do saldo e não dá para desfazer.</AlertDialogDescription>
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

function Tile({ label, value, hint, dot, strong }: { label: string; value: string; hint?: string; dot?: string; strong?: boolean }) {
  return (
    <div className={cn("lg rounded-[20px] border border-border bg-card px-4 py-4", strong && "bg-white/[0.1]")}>
      <dt className="flex items-center gap-2 text-[13px] text-muted-foreground">
        {dot && <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: dot }} />}
        {label}
      </dt>
      <dd className="mt-1 text-[22px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-white sm:text-[24px]">{value}</dd>
      {hint && <dd className="mt-0.5 text-[13px] text-muted-foreground">{hint}</dd>}
    </div>
  );
}
