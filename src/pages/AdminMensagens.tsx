import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, MessageCircle, MoreHorizontal, Pencil, Plus, Search, Send, Trash2 } from "lucide-react";
import { PAINEL_SQL, mensagensStore, newId, type Mensagem } from "@/lib/adminStore";
import { AdminPage, Field, LocalOnlyNotice } from "@/components/admin/ui";
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

const CATEGORIAS = ["Orçamento", "Evento", "Entrega", "Cobrança", "Pós-venda", "Geral"];
const SEED_FLAG = "gofocus_mensagens_seeded";
const EASE = [0.16, 1, 0.3, 1] as const;

/* The blanks a message can have, how they're asked, and an example. */
const CAMPOS: Record<string, { label: string; exemplo: string; tipo?: string }> = {
  nome: { label: "Nome do cliente", exemplo: "Ana" },
  data: { label: "Data", exemplo: "20/12", tipo: "text" },
  hora: { label: "Hora", exemplo: "15h" },
  local: { label: "Local", exemplo: "Salão Primavera" },
  valor: { label: "Valor", exemplo: "R$ 1.200,00" },
  numero: { label: "Nº da proposta", exemplo: "GOF-0012" },
  link: { label: "Link", exemplo: "https://gofocus.com.br/projeto/…" },
};

const PADRAO: Omit<Mensagem, "id" | "created_at">[] = [
  { categoria: "Orçamento", titulo: "Envio de orçamento", texto: "Oi, {nome}! Tudo bem? Aqui é da GoFocus. Segue a proposta {numero} no valor de {valor}. Qualquer dúvida é só me chamar por aqui." },
  { categoria: "Orçamento", titulo: "Lembrete de proposta", texto: "Oi, {nome}! Passando para saber se você conseguiu ver a proposta que enviei. Ela vale até {data}. Quer que eu ajuste alguma coisa?" },
  { categoria: "Evento", titulo: "Confirmação do evento", texto: "Oi, {nome}! Confirmando a cobertura do seu evento dia {data} às {hora}, em {local}. Chegamos uns 30 minutos antes para preparar tudo." },
  { categoria: "Evento", titulo: "Véspera do evento", texto: "Oi, {nome}! Amanhã é o grande dia. Estaremos aí às {hora}. Se mudar alguma coisa, me avisa por aqui." },
  { categoria: "Entrega", titulo: "Fotos prontas", texto: "Oi, {nome}! Suas fotos ficaram prontas. É só abrir este link para ver e baixar: {link}" },
  { categoria: "Entrega", titulo: "Previsão de entrega", texto: "Oi, {nome}! Já estamos editando suas fotos. A previsão de entrega é {data}." },
  { categoria: "Cobrança", titulo: "Lembrete de pagamento", texto: "Oi, {nome}! Passando para lembrar do pagamento de {valor}, com vencimento em {data}. Qualquer coisa me fala." },
  { categoria: "Cobrança", titulo: "Pagamento recebido", texto: "Oi, {nome}! Recebemos seu pagamento de {valor}. Muito obrigado!" },
  { categoria: "Pós-venda", titulo: "Pedir avaliação", texto: "Oi, {nome}! Foi um prazer fotografar com você. Se puder, conta como foi a experiência? Ajuda muito a GoFocus. Obrigado!" },
  { categoria: "Pós-venda", titulo: "Marcar no Instagram", texto: "Oi, {nome}! Se postar alguma foto, marca a gente no Instagram: @gofocus.br. Vamos adorar repostar!" },
];

const camposDe = (texto: string) => Array.from(new Set(Array.from(texto.matchAll(/\{(\w+)\}/g)).map(m => m[1])));
const preencher = (texto: string, valores: Record<string, string>) =>
  texto.replace(/\{(\w+)\}/g, (_, k: string) => (valores[k]?.trim() ? valores[k].trim() : `{${k}}`));

export default function AdminMensagens() {
  const [lista, setLista] = useState<Mensagem[]>([]);
  const [remoto, setRemoto] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<Mensagem | null>(null);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [telefone, setTelefone] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [form, setForm] = useState<Mensagem | null>(null);
  const [apagar, setApagar] = useState<Mensagem | null>(null);
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches);
  const textoRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    (async () => {
      const m = await mensagensStore.detect();
      setRemoto(m === "remote");
      let l = await mensagensStore.list().catch(() => [] as Mensagem[]);
      let seeded = false;
      try { seeded = localStorage.getItem(SEED_FLAG) === "1"; } catch { /* ignore */ }
      if (l.length === 0 && !seeded) {
        const base = Date.now();
        const novos = PADRAO.map((p, i) => ({ ...p, id: newId(), created_at: new Date(base + i).toISOString() }));
        try { await mensagensStore.saveMany(novos); l = novos; } catch { l = novos; }
        try { localStorage.setItem(SEED_FLAG, "1"); } catch { /* ignore */ }
      }
      setLista(l);
      setLoaded(true);
      if (window.matchMedia("(min-width: 1024px)").matches && l.length) setSel([...l].sort(ordem)[0]);
    })();
  }, []);

  const ordem = (a: Mensagem, b: Mensagem) =>
    CATEGORIAS.indexOf(a.categoria) - CATEGORIAS.indexOf(b.categoria) || a.created_at.localeCompare(b.created_at);

  const grupos = useMemo(() => {
    const q = busca.toLowerCase().trim();
    const filtradas = [...lista].sort(ordem).filter(m => !q || m.titulo.toLowerCase().includes(q) || m.texto.toLowerCase().includes(q));
    const map = new Map<string, Mensagem[]>();
    for (const m of filtradas) map.set(m.categoria, [...(map.get(m.categoria) || []), m]);
    return Array.from(map.entries());
  }, [lista, busca]);

  const escolher = (m: Mensagem) => { setSel(m); setCopiado(false); };

  const final = sel ? preencher(sel.texto, valores) : "";
  const faltando = sel ? camposDe(sel.texto).filter(k => !valores[k]?.trim()) : [];

  const copiar = async () => {
    try { await navigator.clipboard.writeText(final); setCopiado(true); toast.success("Mensagem copiada"); }
    catch { toast.error("Não deu para copiar. Selecione o texto e copie manualmente."); }
  };

  const abrirWhatsApp = () => {
    let num = telefone.replace(/\D/g, "");
    if (num && num.length <= 11) num = `55${num}`;
    const url = `https://wa.me/${num}?text=${encodeURIComponent(final)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const salvar = async () => {
    if (!form) return;
    if (!form.titulo.trim() || !form.texto.trim()) { toast.error("Preencha o nome e o texto da mensagem."); return; }
    try {
      const saved = await mensagensStore.save({ ...form, titulo: form.titulo.trim(), texto: form.texto.trim() });
      setLista(l => [saved, ...l.filter(x => x.id !== saved.id)]);
      setSel(saved);
      setForm(null);
      toast.success("Mensagem salva");
    } catch (e) { toast.error(`Não deu para salvar: ${(e as Error).message}`); }
  };

  const confirmarApagar = async () => {
    const m = apagar; setApagar(null);
    if (!m) return;
    try {
      await mensagensStore.remove(m.id);
      setLista(l => l.filter(x => x.id !== m.id));
      if (sel?.id === m.id) setSel(null);
    } catch (e) { toast.error(`Não deu para apagar: ${(e as Error).message}`); }
  };

  const inserirCampo = (k: string) => {
    if (!form) return;
    const el = textoRef.current;
    const pos = el?.selectionStart ?? form.texto.length;
    const texto = `${form.texto.slice(0, pos)}{${k}}${form.texto.slice(pos)}`;
    setForm({ ...form, texto });
    requestAnimationFrame(() => { el?.focus(); const p = pos + k.length + 2; el?.setSelectionRange(p, p); });
  };

  /* ── Use panel ── */
  const painelUso = sel && (
    <motion.section
      key={sel.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
      aria-label={`Usar ${sel.titulo}`}
      className={cn(isDesktop && "lg rounded-[24px] border border-border bg-card p-5")}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] text-muted-foreground">{sel.categoria}</p>
          <h2 className="text-[20px] font-semibold tracking-[-0.01em] text-white">{sel.titulo}</h2>
        </div>
        <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setForm(sel)}><Pencil /> Editar</Button>
      </div>

      {camposDe(sel.texto).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {camposDe(sel.texto).map(k => (
            <Field key={k} label={CAMPOS[k]?.label ?? k} htmlFor={`msg-${k}`} className={k === "link" ? "col-span-2" : undefined}>
              <Input
                id={`msg-${k}`}
                value={valores[k] || ""}
                onChange={e => { setValores(v => ({ ...v, [k]: e.target.value })); setCopiado(false); }}
                placeholder={CAMPOS[k]?.exemplo ?? ""}
              />
            </Field>
          ))}
        </div>
      )}

      <p className="mb-2 mt-5 text-[13px] font-medium text-muted-foreground">Como vai ficar</p>
      <div className="rounded-[20px] rounded-tl-[6px] border border-white/[0.08] bg-[#1f3b2d]/60 px-4 py-3 text-[15px] leading-relaxed text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
        {final.split(/(\{\w+\})/g).map((parte, i) =>
          /^\{\w+\}$/.test(parte)
            ? <span key={i} className="rounded-md bg-white/15 px-1 text-white/70">{CAMPOS[parte.slice(1, -1)]?.label.toLowerCase() ?? parte}</span>
            : <span key={i}>{parte}</span>
        )}
      </div>
      {faltando.length > 0 && (
        <p className="mt-2 text-[13px] text-muted-foreground">Falta preencher: {faltando.map(k => CAMPOS[k]?.label.toLowerCase() ?? k).join(", ")}.</p>
      )}

      <Field label="WhatsApp do cliente" htmlFor="msg-tel" hint="Opcional. Sem número, o WhatsApp abre para você escolher o contato." className="mt-5">
        <Input id="msg-tel" type="tel" inputMode="tel" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(15) 99999-9999" />
      </Field>

      <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
        <Button className="h-12 rounded-full text-[15px]" onClick={abrirWhatsApp}><Send /> Abrir no WhatsApp</Button>
        <Button variant="outline" className="h-12 rounded-full" onClick={copiar}>{copiado ? <Check /> : <Copy />} {copiado ? "Copiado" : "Copiar"}</Button>
      </div>
    </motion.section>
  );

  return (
    <AdminPage
      title="Mensagens prontas"
      description="Textos que você manda sempre: preencha o nome e abra direto no WhatsApp."
      actions={<Button className="rounded-full" onClick={() => setForm({ id: newId(), created_at: new Date().toISOString(), titulo: "", texto: "", categoria: "Geral" })}><Plus /> Nova mensagem</Button>}
    >
      {loaded && !remoto && <LocalOnlyNotice sql={PAINEL_SQL} what="As mensagens estão salvas só neste navegador." />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="min-w-0 space-y-5">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar mensagem" aria-label="Buscar mensagem" className="h-11 rounded-full pl-11" />
          </div>

          {!loaded ? (
            <div className="grid gap-3 sm:grid-cols-2" aria-busy="true">{[0, 1, 2, 3].map(i => <div key={i} className="h-32 animate-pulse rounded-[20px] bg-white/[0.04]" />)}</div>
          ) : grupos.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-white/15 px-6 py-12 text-center">
              <MessageCircle className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
              <p className="text-[15px] font-medium text-white">{busca ? "Nenhuma mensagem encontrada" : "Nenhuma mensagem ainda"}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{busca ? "Tente outra palavra." : "Crie a primeira com Nova mensagem."}</p>
            </div>
          ) : (
            grupos.map(([cat, ms]) => (
              <section key={cat} aria-label={cat}>
                <h2 className="mb-2.5 flex items-baseline gap-2 text-[16px] font-semibold text-white">{cat}<span className="text-[13px] font-normal text-muted-foreground">{ms.length}</span></h2>
                <ul className="grid gap-3 sm:grid-cols-2">
                  <AnimatePresence initial={false}>
                    {ms.map(m => {
                      const ativa = sel?.id === m.id;
                      return (
                        <motion.li
                          key={m.id}
                          layout="position"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.96 }}
                          transition={{ duration: 0.28, ease: EASE }}
                          className={cn("glass-lift group relative rounded-[20px] border border-border bg-card", ativa && "ring-1 ring-white/40")}
                        >
                          <button type="button" onClick={() => escolher(m)} className="block w-full p-4 pr-12 text-left" aria-pressed={ativa}>
                            <p className="text-[15px] font-semibold text-white">{m.titulo}</p>
                            <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{m.texto}</p>
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button type="button" aria-label={`Opções de ${m.titulo}`} className="absolute right-2.5 top-2.5 z-[4] grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-white/10 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem onSelect={() => setForm(m)}><Pencil className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setForm({ ...m, id: newId(), created_at: new Date().toISOString(), titulo: `${m.titulo} (cópia)` })}><Copy className="mr-2 h-4 w-4" /> Duplicar</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => setApagar(m)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Apagar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </section>
            ))
          )}
        </div>

        {isDesktop ? (
          <div className="sticky top-6">
            {painelUso || (
              <div className="lg grid place-items-center rounded-[24px] border border-border bg-card px-6 py-16 text-center">
                <div>
                  <MessageCircle className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
                  <p className="text-[15px] font-medium text-white">Escolha uma mensagem</p>
                  <p className="mt-1 text-[13px] text-muted-foreground">Ela aparece aqui para preencher e enviar.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Dialog open={!!sel} onOpenChange={o => !o && setSel(null)}>
            <DialogContent className="max-h-[90dvh] overflow-y-auto">
              <DialogHeader className="sr-only">
                <DialogTitle>{sel?.titulo}</DialogTitle>
                <DialogDescription>Preencha e envie a mensagem</DialogDescription>
              </DialogHeader>
              {painelUso}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Dialog open={!!form} onOpenChange={o => !o && setForm(null)}>
        <DialogContent className="sm:max-w-lg" onOpenAutoFocus={(e) => { e.preventDefault(); window.setTimeout(() => document.getElementById("mf-titulo")?.focus(), 30); }}>
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold">{form && lista.some(m => m.id === form.id) ? "Editar mensagem" : "Nova mensagem"}</DialogTitle>
            <DialogDescription>Use os campos entre chaves para o que muda a cada cliente.</DialogDescription>
          </DialogHeader>
          {form && (
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr_160px] gap-3">
                <Field label="Nome da mensagem" htmlFor="mf-titulo">
                  <Input id="mf-titulo" autoFocus value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Boas-vindas" />
                </Field>
                <Field label="Grupo" htmlFor="mf-cat">
                  <Input id="mf-cat" list="mf-cats" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} />
                  <datalist id="mf-cats">{CATEGORIAS.map(c => <option key={c} value={c} />)}</datalist>
                </Field>
              </div>
              <Field label="Texto" htmlFor="mf-texto">
                <Textarea id="mf-texto" ref={textoRef} rows={6} value={form.texto} onChange={e => setForm({ ...form, texto: e.target.value })} placeholder="Oi, {nome}! …" />
              </Field>
              <div>
                <p className="mb-2 text-[13px] text-muted-foreground">Inserir campo no texto:</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(CAMPOS).map(([k, c]) => (
                    <button key={k} type="button" onClick={() => inserirCampo(k)} className="rounded-full border border-white/15 px-3 py-1 text-[13px] text-white/80 hover:border-white/40 hover:text-white">
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
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
            <AlertDialogDescription>A mensagem sai da lista e não dá para desfazer.</AlertDialogDescription>
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
