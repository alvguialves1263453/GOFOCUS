import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useFotos } from "@/hooks/useFotos";
import UploadZone from "@/components/admin/UploadZone";
import PhotoGallery from "@/components/admin/PhotoGallery";
import WatermarkConfig from "@/components/admin/WatermarkConfig";
import { ArrowLeft, Save, Loader2, Image, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminPage, Field, LoadingBlock, Panel, StatusBadge } from "@/components/admin/ui";
import { toast } from "sonner";
import type { Evento, Foto } from "@/types/eventos";

const statusOptions = [
  { value: "rascunho", label: "Rascunho", desc: "Não visível ao público" },
  { value: "ativo", label: "Ativo", desc: "Visível na vitrine" },
  { value: "arquivado", label: "Arquivado", desc: "Oculto da vitrine" },
];

export default function AdminEventoEdit() {
  const { id } = useParams();
  const isNew = id === "novo";
  const navigate = useNavigate();

  const [evento, setEvento] = useState<Evento>({
    id: "", titulo: "", descricao: "", data_evento: "", local: "",
    capa_url: "", preco_foto: 0, status: "rascunho",
  } as Evento);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingFotos, setPendingFotos] = useState<Foto[]>([]);
  const [precoRaw, setPrecoRaw] = useState("");
  const [watermarkOpen, setWatermarkOpen] = useState(false);

  const {
    fotos, loading: fotosLoading,
    addFotos, deleteFotos, setCapa, refetch: refetchFotos,
  } = useFotos(!isNew ? id : undefined);

  useEffect(() => {
    if (!isNew && id) loadEvento();
    else setLoading(false);
  }, [id]);

  async function loadEvento() {
    setLoading(true);
    const { data: ev } = await supabase
      .from("eventos").select("*").eq("id", id).single();
    if (ev) {
      setEvento(ev as Evento);
      setPrecoRaw(ev.preco_foto > 0 ? Number(ev.preco_foto).toFixed(2).replace(".", ",") : "");
    }
    setLoading(false);
  }

  async function handleSave() {
    if (!evento.titulo.trim()) { toast.error("Título é obrigatório"); return; }
    setSaving(true);
    try {
      if (isNew) {
        const { data, error } = await supabase.from("eventos").insert({
          titulo: evento.titulo,
          descricao: evento.descricao || null,
          data_evento: evento.data_evento || null,
          local: evento.local || null,
          capa_url: evento.capa_url || null,
          preco_foto: evento.preco_foto,
          status: evento.status,
        }).select().single();
        if (error) throw error;

        if (pendingFotos.length > 0) {
          const { error: fe } = await supabase.from("fotos").insert(
            pendingFotos.map((f, i) => ({
              evento_id: data.id,
              url_original: f.url_original,
              url_thumbnail: f.url_thumbnail,
              url_watermark: f.url_watermark,
              ordem: i,
            }))
          );
          if (fe) throw fe;
        }

        toast.success("Evento criado!");
        navigate(`/admin/eventos/${data.id}`, { replace: true });
      } else {
        const { error } = await supabase.from("eventos").update({
          titulo: evento.titulo,
          descricao: evento.descricao || null,
          data_evento: evento.data_evento || null,
          local: evento.local || null,
          capa_url: evento.capa_url || null,
          preco_foto: evento.preco_foto,
          status: evento.status,
        }).eq("id", id);
        if (error) throw error;
        toast.success("Evento atualizado!");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    }
    setSaving(false);
  }

  const handleUploadComplete = async (results: { url: string; file: File }[]) => {
    if (isNew) {
      const novas: Foto[] = results.map((r, i) => ({
        id: `temp-${Date.now()}-${i}`,
        evento_id: "",
        url_original: r.url,
        url_thumbnail: null,
        url_watermark: r.url,
        ordem: pendingFotos.length + i,
      }));
      setPendingFotos((prev) => [...prev, ...novas]);
    } else {
      await addFotos(results.map((r) => ({
        url_original: r.url,
        url_thumbnail: null,
        url_watermark: r.url,
        ordem: fotos.length,
      })));
    }
  };

  const handleDeleteFotos = async (ids: string[]) => {
    if (isNew) {
      setPendingFotos((prev) => prev.filter((f) => !ids.includes(f.id)));
      toast.success(`${ids.length} foto(s) removida(s)`);
    } else {
      await deleteFotos(ids);
    }
  };

  const handleSetCapa = async (url: string) => {
    if (isNew) {
      setEvento((prev) => ({ ...prev, capa_url: url }));
      toast.success("Capa definida!");
    } else {
      await setCapa(url);
      setEvento((prev) => ({ ...prev, capa_url: url }));
    }
  };

  const allFotos = isNew ? pendingFotos : fotos;
  const capaUrl = evento.capa_url;

  const backButton = (
    <Button variant="ghost" size="sm" onClick={() => navigate("/admin/eventos")} className="-ml-2">
      <ArrowLeft aria-hidden="true" /> Voltar
    </Button>
  );

  if (loading) {
    return (
      <AdminPage title={isNew ? "Novo evento" : "Editar evento"} back={backButton}>
        <LoadingBlock label={isNew ? "Preparando…" : "Carregando evento…"} />
      </AdminPage>
    );
  }

  const statusTone = evento.status === "ativo" ? "success" : evento.status === "arquivado" ? "neutral" : "warning";
  const statusLabel = statusOptions.find((o) => o.value === evento.status)?.label ?? evento.status;

  return (
    <AdminPage
      back={backButton}
      title={isNew ? "Novo evento" : "Editar evento"}
      description={
        !isNew ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <StatusBadge tone={statusTone}>{statusLabel}</StatusBadge>
            <span>
              {allFotos.length} foto{allFotos.length !== 1 ? "s" : ""}
              {evento.data_evento && ` · ${new Date(evento.data_evento).toLocaleDateString("pt-BR")}`}
            </span>
          </span>
        ) : undefined
      }
      actions={
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-1">
          <Panel title="Detalhes" bodyClassName="space-y-5">
            <Field label="Título *" htmlFor="evento-titulo">
              <Input
                id="evento-titulo"
                type="text"
                value={evento.titulo}
                onChange={(e) => setEvento((p) => ({ ...p, titulo: e.target.value }))}
                placeholder="Ex: Corrida de Itapeva 2026"
                required
                aria-required="true"
              />
            </Field>

            <Field label="Descrição" htmlFor="evento-descricao">
              <Textarea
                id="evento-descricao"
                value={evento.descricao || ""}
                rows={3}
                onChange={(e) => setEvento((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Descrição do evento…"
                className="resize-none"
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Field label="Data" htmlFor="evento-data">
                <Input
                  id="evento-data"
                  type="date"
                  value={evento.data_evento || ""}
                  onChange={(e) => setEvento((p) => ({ ...p, data_evento: e.target.value }))}
                  className="[color-scheme:dark]"
                />
              </Field>
              <Field label="Preço por foto" htmlFor="evento-preco">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground" aria-hidden="true">
                    R$
                  </span>
                  <Input
                    id="evento-preco"
                    type="text"
                    inputMode="decimal"
                    value={precoRaw}
                    onFocus={() => setPrecoRaw(evento.preco_foto > 0 ? evento.preco_foto.toFixed(2).replace(".", ",") : "")}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^0-9,]/g, "");
                      setPrecoRaw(raw);
                      const numeric = parseFloat(raw.replace(",", "."));
                      if (!isNaN(numeric)) setEvento((p) => ({ ...p, preco_foto: numeric }));
                      else if (raw === "") setEvento((p) => ({ ...p, preco_foto: 0 }));
                    }}
                    onBlur={() => setPrecoRaw(evento.preco_foto > 0 ? evento.preco_foto.toFixed(2).replace(".", ",") : "")}
                    placeholder="0,00"
                    className="pl-10 tabular-nums"
                  />
                </div>
              </Field>
            </div>

            <Field label="Cidade" htmlFor="evento-local">
              <Input
                id="evento-local"
                type="text"
                value={evento.local || ""}
                onChange={(e) => setEvento((p) => ({ ...p, local: e.target.value }))}
                placeholder="Ex: Itapeva"
                list="cidades-suggest"
              />
              <datalist id="cidades-suggest">
                <option value="Itapeva - SP" />
                <option value="Itapetininga - SP" />
                <option value="Sorocaba - SP" />
                <option value="Sao Paulo - SP" />
                <option value="Campinas - SP" />
                <option value="Sao Jose dos Campos - SP" />
                <option value="Ribeirao Preto - SP" />
                <option value="Sao Bernardo do Campo - SP" />
                <option value="Santo Andre - SP" />
                <option value="Guarulhos - SP" />
                <option value="Osasco - SP" />
                <option value="Jundiai - SP" />
                <option value="Piracicaba - SP" />
                <option value="Bauru - SP" />
                <option value="Sao Jose do Rio Preto - SP" />
                <option value="Taubate - SP" />
                <option value="Praia Grande - SP" />
                <option value="Mogi das Cruzes - SP" />
                <option value="Indaiatuba - SP" />
                <option value="Itu - SP" />
                <option value="Rio de Janeiro - RJ" />
                <option value="Belo Horizonte - MG" />
                <option value="Curitiba - PR" />
                <option value="Florianopolis - SC" />
                <option value="Porto Alegre - RS" />
                <option value="Brasilia - DF" />
                <option value="Goiania - GO" />
                <option value="Salvador - BA" />
                <option value="Fortaleza - CE" />
                <option value="Recife - PE" />
              </datalist>
            </Field>

            <Field
              label="Status"
              htmlFor="evento-status"
              hint={statusOptions.find((o) => o.value === evento.status)?.desc}
            >
              <Select value={evento.status} onValueChange={(v) => setEvento((p) => ({ ...p, status: v }))}>
                <SelectTrigger id="evento-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </Panel>

          <Panel title="Capa" description="Imagem de destaque do evento na vitrine.">
            {capaUrl ? (
              <div className="relative overflow-hidden rounded-lg border border-border">
                <img src={capaUrl} alt="Capa do evento" className="aspect-video w-full object-cover" />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEvento((p) => ({ ...p, capa_url: "" }))}
                  className="absolute right-2 top-2"
                >
                  <X aria-hidden="true" /> Remover
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-input px-4 py-8 text-center">
                <Image className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-[14px] text-muted-foreground">
                  Selecione uma foto como capa na galeria
                </p>
              </div>
            )}
          </Panel>
        </div>

        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Panel title="Fotos" description="Envie as fotos do evento e escolha a capa." bodyClassName="space-y-6">
            <UploadZone
              folder={isNew ? "eventos/novo" : `eventos/${id}`}
              onUploadComplete={handleUploadComplete}
            />
            <PhotoGallery
              fotos={allFotos}
              capaUrl={capaUrl}
              loading={fotosLoading}
              onDelete={handleDeleteFotos}
              onSetCapa={handleSetCapa}
            />
          </Panel>

          <Panel
            title="Marca d'água"
            description="Aplicada às fotos exibidas na galeria pública."
            actions={
              !isNew && (
                <Button variant="secondary" onClick={() => setWatermarkOpen(true)}>
                  <Settings aria-hidden="true" /> Configurar
                </Button>
              )
            }
          >
            {isNew ? (
              <p className="text-[14px] text-muted-foreground">
                Salve o evento para configurar a marca d'água.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge tone={evento.watermark_enabled && evento.watermark_image ? "success" : "neutral"}>
                  {evento.watermark_enabled && evento.watermark_image ? "Ativada" : "Desativada"}
                </StatusBadge>
                {evento.watermark_image && (
                  <img
                    src={evento.watermark_image}
                    alt="Imagem da marca d'água"
                    className="h-10 w-auto max-w-[160px] rounded-md bg-muted object-contain p-1"
                  />
                )}
              </div>
            )}
          </Panel>
        </div>
      </div>

      <WatermarkConfig
        open={watermarkOpen}
        onClose={() => setWatermarkOpen(false)}
        evento={evento}
        onSave={async (updates) => {
          const { error } = await supabase.from("eventos").update(updates).eq("id", id);
          if (error) throw error;
          setEvento((p) => ({ ...p, ...updates }));
        }}
      />
    </AdminPage>
  );
}
