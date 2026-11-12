import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, Check, Copy, ExternalLink, Eye, EyeOff, Instagram, Plus, Trash2 } from "lucide-react";
import { PAINEL_SQL, destaquesStore, instagramEmbed, newId, type LinkDestaque } from "@/lib/adminStore";
import { AdminPage, Field } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EASE = [0.16, 1, 0.3, 1] as const;

export default function AdminLinks() {
  const [lista, setLista] = useState<LinkDestaque[]>([]);
  const [remoto, setRemoto] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [url, setUrl] = useState("");
  const [titulo, setTitulo] = useState("");
  const [apagar, setApagar] = useState<LinkDestaque | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    (async () => {
      const m = await destaquesStore.detect();
      setRemoto(m === "remote");
      const l = await destaquesStore.list().catch(() => [] as LinkDestaque[]);
      setLista(l.sort((a, b) => a.ordem - b.ordem));
      setLoaded(true);
    })();
  }, []);

  const preview = instagramEmbed(url);

  const adicionar = async () => {
    if (!preview) { toast.error("Cole o link de um post ou reel do Instagram."); return; }
    const novo: LinkDestaque = {
      id: newId(), created_at: new Date().toISOString(), url: url.trim(),
      titulo: titulo.trim() || null, ordem: lista.length ? Math.max(...lista.map(l => l.ordem)) + 1 : 0, ativo: true,
    };
    try {
      await destaquesStore.save(novo);
      setLista(l => [...l, novo]);
      setUrl(""); setTitulo("");
      toast.success("Destaque adicionado à página de links");
    } catch (e) { toast.error(`Não deu para salvar: ${(e as Error).message}`); }
  };

  const mover = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= lista.length) return;
    const next = [...lista];
    [next[i], next[j]] = [next[j], next[i]];
    const renum = next.map((d, k) => ({ ...d, ordem: k }));
    setLista(renum);
    try { await destaquesStore.saveMany(renum); } catch (e) { toast.error((e as Error).message); }
  };

  const alternar = async (d: LinkDestaque) => {
    const next = { ...d, ativo: !d.ativo };
    setLista(l => l.map(x => (x.id === d.id ? next : x)));
    try { await destaquesStore.save(next); } catch (e) { toast.error((e as Error).message); }
  };

  const confirmarApagar = async () => {
    const d = apagar; setApagar(null);
    if (!d) return;
    try { await destaquesStore.remove(d.id); setLista(l => l.filter(x => x.id !== d.id)); }
    catch (e) { toast.error(`Não deu para apagar: ${(e as Error).message}`); }
  };

  return (
    <AdminPage
      title="Página de links"
      description="A página do link da bio do Instagram. Escolha os vídeos e posts que aparecem em destaque."
      actions={
        <Button variant="outline" className="rounded-full" onClick={() => window.open("/links", "_blank", "noopener")}>
          <ExternalLink /> Abrir página
        </Button>
      }
    >
      {loaded && !remoto && (
        <div className="lg mb-4 flex flex-col gap-3 rounded-[18px] border border-border bg-card px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-[14px] font-medium text-white">Os destaques ainda não aparecem para os visitantes.</p>
            <p className="text-[13px] text-muted-foreground">Falta criar a tabela no Supabase: cole o comando no SQL Editor e clique em Run, uma vez. O que você adicionar aqui sobe sozinho.</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => { navigator.clipboard?.writeText(PAINEL_SQL); setCopiado(true); toast.success("Comando copiado. Cole no SQL Editor do Supabase e clique em Run."); }}
          >
            {copiado ? <Check /> : <Copy />} {copiado ? "Copiado" : "Copiar comando"}
          </Button>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div className="space-y-4">
          <section aria-label="Adicionar destaque" className="lg rounded-[24px] border border-border bg-card p-5">
            <h2 className="text-[16px] font-semibold text-white">Adicionar vídeo ou post</h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">No Instagram, toque nos três pontinhos do reel ou post, em "Copiar link", e cole aqui.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
              <Field label="Link do Instagram" htmlFor="lk-url" error={url && !preview ? "Esse link não é de um post ou reel do Instagram." : undefined}>
                <div className="relative">
                  <Instagram className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="lk-url" className="pl-9" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/…" onKeyDown={e => e.key === "Enter" && adicionar()} />
                </div>
              </Field>
              <Field label="Legenda (opcional)" htmlFor="lk-titulo">
                <Input id="lk-titulo" value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Festa 15 anos da Bia" onKeyDown={e => e.key === "Enter" && adicionar()} />
              </Field>
              <Button className="rounded-full" onClick={adicionar} disabled={!preview}><Plus /> Adicionar</Button>
            </div>
          </section>

          <section aria-label="Destaques" className="lg rounded-[24px] border border-border bg-card p-5">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[16px] font-semibold text-white">Na página, nesta ordem</h2>
              <span className="text-[13px] text-muted-foreground">{lista.filter(d => d.ativo).length} visíveis</span>
            </div>
            {lista.length === 0 ? (
              <p className="rounded-[16px] border border-dashed border-white/15 px-4 py-8 text-center text-[14px] text-muted-foreground">
                Nenhum destaque ainda. Sem destaques, a página mostra só os botões e os álbuns.
              </p>
            ) : (
              <ul className="space-y-2">
                <AnimatePresence initial={false}>
                  {lista.map((d, i) => {
                    const e = instagramEmbed(d.url);
                    return (
                      <motion.li
                        key={d.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: EASE }}
                        className={cn("flex items-center gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.035] p-3", !d.ativo && "opacity-50")}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.08] text-[13px] font-semibold tabular-nums text-white">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-medium text-white">{d.titulo || (e?.kind === "reel" ? "Reel" : "Post")}</p>
                          <a href={d.url} target="_blank" rel="noopener noreferrer" className="block truncate text-[12px] text-muted-foreground hover:text-white hover:underline">{d.url.replace(/^https?:\/\/(www\.)?/, "")}</a>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Subir"><ArrowUp /></Button>
                          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => mover(i, 1)} disabled={i === lista.length - 1} aria-label="Descer"><ArrowDown /></Button>
                          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => alternar(d)} aria-label={d.ativo ? "Esconder da página" : "Mostrar na página"} title={d.ativo ? "Esconder" : "Mostrar"}>
                            {d.ativo ? <Eye /> : <EyeOff />}
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-destructive/15 hover:text-destructive" onClick={() => setApagar(d)} aria-label="Remover destaque"><Trash2 /></Button>
                        </div>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
            )}
          </section>
        </div>

        <section aria-label="Prévia" className="lg sticky top-6 rounded-[24px] border border-border bg-card p-4">
          <h2 className="mb-3 px-1 text-[16px] font-semibold text-white">Prévia</h2>
          {preview ? (
            <div className="overflow-hidden rounded-[18px] bg-white">
              <iframe src={preview.embed} title="Prévia do post" scrolling="no" className="block h-[520px] w-full border-0" />
            </div>
          ) : (
            <p className="rounded-[16px] border border-dashed border-white/15 px-4 py-14 text-center text-[14px] text-muted-foreground">
              Cole um link ao lado para ver como o vídeo ou post aparece na página.
            </p>
          )}
        </section>
      </div>

      <AlertDialog open={!!apagar} onOpenChange={o => !o && setApagar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tirar este destaque da página?</AlertDialogTitle>
            <AlertDialogDescription>O post continua no Instagram; só sai da página de links.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={confirmarApagar}>Tirar da página</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPage>
  );
}
