import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { BarChart3, Camera, Heart, Receipt, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getProjectsAsync, getCategoriesAsync, type Project, type Category } from "@/lib/storage";
import { getAllInstagramPosts, getInstagramClients, type InstagramClient, type InstagramPost } from "@/lib/instagram";
import { useOrcamentos } from "@/hooks/useOrcamentos";
import { formatarValor } from "@/data/servicos";
import type { OrcamentoStatus } from "@/lib/orcamentosStorage";
import { AdminPage, CountUp, EmptyState, Segmented, StatusBadge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/*
 * GoFocus metrics: what the studio published, what it earned, how proposals go.
 * Colours: categorical slots 1-2 of the reference palette, dark steps, validated on the
 * admin glass surface (#2a2930): blue = the main series, orange = the comparison series.
 */
const SERIES_1 = "#3987e5";
const SERIES_2 = "#d95926";
const GRID = "rgba(255,255,255,0.07)";
const AXIS = {
  stroke: "transparent",
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;
const ANIM = { animationDuration: 900, animationEasing: "ease-out" as const };

type Period = "3" | "6" | "12" | "all";
type Payment = { id: string; client_id: string; date: string; amount: number; status: "paid" | "pending" };
type Expense = { id: string; client_id: string; date: string; amount: number };
type EventoRow = { id: string; titulo: string; status: string; created_at: string; fotos: { count: number }[] };

const monthKey = (d: string | Date) => {
  const x = typeof d === "string" ? new Date(d) : d;
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
};
const monthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  const s = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
  return `${s}/${String(y).slice(2)}`;
};
const shortMoney = (v: number) =>
  v >= 1000 ? `R$ ${(v / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : `R$ ${Math.round(v)}`;

const statusLabels: Record<OrcamentoStatus, string> = {
  rascunho: "Rascunho", enviado: "Enviado", aprovado: "Aprovado", recusado: "Recusado", expirado: "Expirado",
};
const statusTone: Record<OrcamentoStatus, "neutral" | "success" | "warning" | "danger" | "info"> = {
  rascunho: "warning", enviado: "info", aprovado: "success", recusado: "danger", expirado: "neutral",
};

export default function AdminMetricas() {
  const [period, setPeriod] = useState<Period>("6");
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [eventos, setEventos] = useState<EventoRow[]>([]);
  const [clients, setClients] = useState<InstagramClient[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [loaded, setLoaded] = useState(false);
  const { orcamentos } = useOrcamentos();

  useEffect(() => {
    const safe = async <T,>(p: PromiseLike<T> | Promise<T>, fallback: T): Promise<T> => {
      try { return await p; } catch { return fallback; }
    };
    Promise.all([
      safe(getProjectsAsync(), [] as Project[]),
      safe(getCategoriesAsync(), [] as Category[]),
      safe(supabase.from("eventos").select("id, titulo, status, created_at, fotos(count)").then(r => (r.data || []) as EventoRow[]), []),
      safe(getInstagramClients(), [] as InstagramClient[]),
      safe(supabase.from("instagram_payments").select("*").then(r => (r.data || []) as Payment[]), []),
      safe(supabase.from("instagram_expenses").select("*").then(r => (r.data || []) as Expense[]), []),
      safe(getAllInstagramPosts(), [] as InstagramPost[]),
    ]).then(([p, c, e, cl, pay, exp, po]) => {
      setProjects(p); setCategories(c); setEventos(e); setClients(cl);
      setPayments(pay); setExpenses(exp); setPosts(po); setLoaded(true);
    });
  }, []);

  /* The months on the x-axis for the chosen period (oldest first). */
  const months = useMemo(() => {
    const now = new Date();
    let count = period === "all" ? 12 : Number(period);
    if (period === "all") {
      const dates = [
        ...projects.map(p => p.createdAt), ...payments.map(p => p.date),
        ...orcamentos.map(o => o.created_at), ...posts.map(p => p.date),
      ].filter(Boolean).map(d => new Date(d).getTime());
      if (dates.length) {
        const first = new Date(Math.min(...dates));
        count = Math.min(36, (now.getFullYear() - first.getFullYear()) * 12 + now.getMonth() - first.getMonth() + 1);
      }
    }
    return Array.from({ length: Math.max(1, count) }, (_, i) => monthKey(new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1)));
  }, [period, projects, payments, orcamentos, posts]);

  const inPeriod = (d?: string | null) => !!d && (period === "all" || months.includes(monthKey(d)));
  const realPhotos = (p: Project) => p.photos?.filter(f => !f.isDivider).length || 0;

  const data = useMemo(() => {
    const periodProjects = projects.filter(p => inPeriod(p.createdAt));
    const photosByMonth = months.map(m => ({
      mes: monthLabel(m),
      Fotos: projects.filter(p => p.createdAt && monthKey(p.createdAt) === m).reduce((n, p) => n + realPhotos(p), 0),
    }));
    const moneyByMonth = months.map(m => ({
      mes: monthLabel(m),
      Recebido: payments.filter(p => p.status === "paid" && monthKey(p.date) === m).reduce((n, p) => n + Number(p.amount || 0), 0),
      Despesas: expenses.filter(e => monthKey(e.date) === m).reduce((n, e) => n + Number(e.amount || 0), 0),
    }));
    const reachByMonth = months.map(m => ({
      mes: monthLabel(m),
      Alcance: posts.filter(p => monthKey(p.date) === m).reduce((n, p) => n + Number(p.reach || 0), 0),
    }));
    const byCategory = categories
      .map(c => ({ nome: c.name, Fotos: projects.filter(p => p.categoryId === c.id).reduce((n, p) => n + realPhotos(p), 0) }))
      .filter(c => c.Fotos > 0)
      .sort((a, b) => b.Fotos - a.Fotos);
    const topLiked = [...projects]
      .filter(p => (p.likes || 0) > 0)
      .sort((a, b) => (b.likes || 0) - (a.likes || 0))
      .slice(0, 6)
      .map(p => ({ nome: p.clientName, Curtidas: p.likes || 0 }));

    const periodOrc = orcamentos.filter(o => inPeriod(o.created_at));
    const funnel = (["rascunho", "enviado", "aprovado", "recusado", "expirado"] as OrcamentoStatus[]).map(s => {
      const list = periodOrc.filter(o => o.status === s);
      return { status: s, qtd: list.length, valor: list.reduce((n, o) => n + (o.valor_final || 0), 0) };
    });

    return {
      photos: periodProjects.reduce((n, p) => n + realPhotos(p), 0),
      albums: periodProjects.length,
      likes: projects.reduce((n, p) => n + (p.likes || 0), 0),
      received: moneyByMonth.reduce((n, m) => n + m.Recebido, 0),
      pending: payments.filter(p => p.status === "pending" && inPeriod(p.date)).reduce((n, p) => n + Number(p.amount || 0), 0),
      approved: funnel.find(f => f.status === "aprovado")!,
      proposals: periodOrc.length,
      activeClients: clients.filter(c => c.status === "ativo").length,
      eventPhotos: eventos.reduce((n, e) => n + (e.fotos?.[0]?.count || 0), 0),
      photosByMonth, moneyByMonth, reachByMonth, byCategory, topLiked, funnel,
      hasMoney: moneyByMonth.some(m => m.Recebido || m.Despesas),
      hasPhotos: photosByMonth.some(m => m.Fotos),
      hasReach: reachByMonth.some(m => m.Alcance),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, categories, eventos, clients, payments, expenses, posts, orcamentos, months]);

  const periodText = period === "all" ? "desde o início" : `nos últimos ${period} meses`;
  const maxFunnel = Math.max(1, ...data.funnel.map(f => f.qtd));

  return (
    <AdminPage
      title="Métricas"
      description="Como a GoFocus está indo: fotos publicadas, dinheiro recebido e propostas."
      actions={
        <Segmented<Period>
          label="Período"
          value={period}
          onChange={setPeriod}
          options={[
            { value: "3", label: "3 meses" },
            { value: "6", label: "6 meses" },
            { value: "12", label: "12 meses" },
            { value: "all", label: "Tudo" },
          ]}
        />
      }
    >
      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Camera />} label="Fotos publicadas" value={<CountUp value={data.photos} />} hint={`${data.albums} ${data.albums === 1 ? "álbum" : "álbuns"} ${periodText}`} />
        <Stat icon={<Heart />} label="Curtidas nos álbuns" value={<CountUp value={data.likes} />} hint="somando todos os álbuns" />
        <Stat icon={<Wallet />} label="Recebido no Instagram" value={shortMoney(data.received)} hint={data.pending > 0 ? `${shortMoney(data.pending)} a receber` : `${data.activeClients} ${data.activeClients === 1 ? "cliente ativo" : "clientes ativos"}`} />
        <Stat icon={<Receipt />} label="Propostas aprovadas" value={shortMoney(data.approved.valor)} hint={`${data.approved.qtd} de ${data.proposals} ${periodText}`} />
      </dl>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Fotos publicadas por mês" note="Fotos dos álbuns criados em cada mês.">
          {!loaded ? <ChartSkeleton /> : !data.hasPhotos ? (
            <ChartEmpty text={`Nenhum álbum novo ${periodText}. Escolha "Tudo" para ver o histórico.`} />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.photosByMonth} margin={{ top: 8, right: 4, left: -16, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="mes" {...AXIS} interval="preserveStartEnd" minTickGap={8} />
                <YAxis {...AXIS} allowDecimals={false} width={44} />
                <Tooltip content={<GlassTip />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Bar dataKey="Fotos" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={28} {...ANIM} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Recebido e despesas por mês" note="Pagamentos marcados como pagos e despesas dos clientes do Instagram.">
          {!loaded ? <ChartSkeleton /> : !data.hasMoney ? (
            <ChartEmpty text="Ainda não há pagamentos ou despesas neste período." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.moneyByMonth} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barGap={2} barCategoryGap="24%">
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="mes" {...AXIS} interval="preserveStartEnd" minTickGap={8} />
                <YAxis {...AXIS} width={64} tickFormatter={shortMoney} />
                <Tooltip content={<GlassTip money />} cursor={{ fill: "rgba(255,255,255,0.05)" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 13, color: "hsl(var(--muted-foreground))", paddingTop: 8 }} />
                <Bar dataKey="Recebido" fill={SERIES_1} radius={[4, 4, 0, 0]} maxBarSize={22} {...ANIM} />
                <Bar dataKey="Despesas" fill={SERIES_2} radius={[4, 4, 0, 0]} maxBarSize={22} {...ANIM} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>

        <ChartPanel title="Fotos por categoria" note="Todos os álbuns, do maior para o menor.">
          {!loaded ? <ChartSkeleton /> : data.byCategory.length === 0 ? (
            <ChartEmpty text="Nenhum álbum com categoria ainda." />
          ) : (
            <RankedBars rows={data.byCategory.map(c => ({ label: c.nome, value: c.Fotos }))} unit="fotos" />
          )}
        </ChartPanel>

        <ChartPanel title="Álbuns mais curtidos" note="Curtidas que os visitantes deram em cada álbum.">
          {!loaded ? <ChartSkeleton /> : data.topLiked.length === 0 ? (
            <ChartEmpty text="Nenhum álbum recebeu curtidas ainda." />
          ) : (
            <RankedBars rows={data.topLiked.map(c => ({ label: c.nome, value: c.Curtidas }))} unit="curtidas" />
          )}
        </ChartPanel>

        <ChartPanel title="Propostas por status" note={`Orçamentos criados ${periodText}.`}>
          {data.proposals === 0 ? (
            <ChartEmpty text="Nenhum orçamento neste período." />
          ) : (
            <ul className="space-y-3">
              {data.funnel.map((f, i) => (
                <li key={f.status} className="grid grid-cols-[96px_minmax(0,1fr)_auto] items-center gap-3">
                  <StatusBadge tone={statusTone[f.status]}>{statusLabels[f.status]}</StatusBadge>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className="metric-bar h-full rounded-full"
                      style={{ width: `${(f.qtd / maxFunnel) * 100}%`, background: SERIES_1, animationDelay: `${i * 70}ms` }}
                    />
                  </div>
                  <span className="text-right text-[14px] tabular-nums text-white">
                    {f.qtd} <span className="text-muted-foreground">· {shortMoney(f.valor)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </ChartPanel>

        <ChartPanel title="Alcance dos posts por mês" note="Soma do alcance dos posts registrados nos clientes do Instagram.">
          {!loaded ? <ChartSkeleton /> : !data.hasReach ? (
            <ChartEmpty text="Nenhum post registrado neste período." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.reachByMonth} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                <defs>
                  <linearGradient id="reachFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES_1} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={SERIES_1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="mes" {...AXIS} interval="preserveStartEnd" minTickGap={8} />
                <YAxis {...AXIS} width={52} tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)} mil` : String(v)} />
                <Tooltip content={<GlassTip />} cursor={{ stroke: "rgba(255,255,255,0.25)", strokeWidth: 1 }} />
                <Area type="monotone" dataKey="Alcance" stroke={SERIES_1} strokeWidth={2} fill="url(#reachFill)" activeDot={{ r: 5, stroke: "#2a2930", strokeWidth: 2 }} {...ANIM} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartPanel>
      </div>

      {loaded && projects.length === 0 && orcamentos.length === 0 && clients.length === 0 && (
        <EmptyState icon={<BarChart3 />} title="Ainda sem dados" description="Publique álbuns, salve orçamentos ou cadastre clientes do Instagram para ver as métricas aqui." />
      )}
    </AdminPage>
  );
}

/* ── Pieces ── */

function Stat({ icon, label, value, hint }: { icon: ReactNode; label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="lg rounded-[20px] border border-border bg-card px-4 py-4">
      <dt className="flex items-center gap-2 text-[13px] text-muted-foreground [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        {label}
      </dt>
      <dd className="mt-1.5 text-[26px] font-semibold leading-tight tracking-[-0.02em] tabular-nums text-white">{value}</dd>
      {hint && <dd className="mt-0.5 text-[13px] text-muted-foreground">{hint}</dd>}
    </div>
  );
}

function ChartPanel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="lg rounded-[22px] border border-border bg-card p-5">
      <h2 className="text-[16px] font-semibold text-white">{title}</h2>
      {note && <p className="mt-0.5 text-[13px] text-muted-foreground">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ChartSkeleton() {
  return <div className="h-[240px] animate-pulse rounded-[14px] bg-white/[0.04]" aria-hidden="true" />;
}

function ChartEmpty({ text }: { text: string }) {
  return (
    <div className="grid h-[200px] place-items-center rounded-[14px] border border-dashed border-white/15 px-6 text-center text-[14px] text-muted-foreground">
      {text}
    </div>
  );
}

/** Ranked horizontal bars: label, bar, value. One colour; the length is the message. */
function RankedBars({ rows, unit }: { rows: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <ul className="space-y-3" aria-label={`Ranking por ${unit}`}>
      {rows.map((r, i) => (
        <li key={r.label} className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_auto] items-center gap-3">
          <span className="truncate text-[14px] text-white/85" title={r.label}>{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="metric-bar h-full rounded-full"
              style={{ width: `${(r.value / max) * 100}%`, background: SERIES_1, animationDelay: `${i * 70}ms` }}
            />
          </div>
          <span className="min-w-[48px] text-right text-[14px] font-medium tabular-nums text-white">
            {r.value.toLocaleString("pt-BR")}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Glass tooltip shared by the recharts charts. */
function GlassTip({ active, payload, label, money }: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-[12px] border border-white/10 bg-[#2c2a32]/95 px-3 py-2 text-[13px] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.8)]">
      <p className="mb-1 text-muted-foreground">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="flex items-center gap-2 text-white">
          <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/75">{p.name}</span>
          <span className={cn("ml-auto pl-3 font-semibold tabular-nums")}>
            {money ? formatarValor(Number(p.value)) : Number(p.value).toLocaleString("pt-BR")}
          </span>
        </p>
      ))}
    </div>
  );
}
