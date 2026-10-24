import { useState, useRef, useEffect } from "react";
import { X, Upload, Eye, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { SectionLabel } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import { uploadToImageKit } from "@/lib/imagekit";
import { toast } from "sonner";
import type { Evento, WatermarkPosition, WatermarkSize } from "@/types/eventos";

interface WatermarkConfigProps {
  open: boolean;
  onClose: () => void;
  evento: Evento;
  onSave: (updates: Partial<Evento>) => Promise<void>;
}

const positions: { value: WatermarkPosition; label: string }[] = [
  { value: "centro", label: "Centro" },
  { value: "superior-esquerda", label: "Superior esquerda" },
  { value: "superior-direita", label: "Superior direita" },
  { value: "inferior-esquerda", label: "Inferior esquerda" },
  { value: "inferior-direita", label: "Inferior direita" },
  { value: "repetido", label: "Repetido" },
];

const sizes: { value: WatermarkSize; label: string }[] = [
  { value: "pequena", label: "Pequena" },
  { value: "media", label: "Média" },
  { value: "grande", label: "Grande" },
];

export default function WatermarkConfig({ open, onClose, evento, onSave }: WatermarkConfigProps) {
  const [enabled, setEnabled] = useState(evento.watermark_enabled ?? false);
  const [watermarkImage, setWatermarkImage] = useState(evento.watermark_image || "");
  const [opacity, setOpacity] = useState(evento.watermark_opacity ?? 50);
  const [size, setSize] = useState<WatermarkSize>((evento.watermark_size as WatermarkSize) || "media");
  const [position, setPosition] = useState<WatermarkPosition>((evento.watermark_position as WatermarkPosition) || "centro");
  const [spacing, setSpacing] = useState(evento.watermark_spacing ?? 20);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEnabled(evento.watermark_enabled ?? false);
    setWatermarkImage(evento.watermark_image || "");
    setOpacity(evento.watermark_opacity ?? 50);
    setSize((evento.watermark_size as WatermarkSize) || "media");
    setPosition((evento.watermark_position as WatermarkPosition) || "centro");
    setSpacing(evento.watermark_spacing ?? 20);
  }, [evento, open]);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/png")) {
      toast.error("Apenas imagens PNG são aceitas");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadToImageKit(file, `watermarks/evento_${evento.id}`);
      setWatermarkImage(result.url);
      setEnabled(true);
      toast.success("Marca d'água enviada!");
    } catch {
      toast.error("Erro ao enviar imagem");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        watermark_enabled: enabled,
        watermark_image: watermarkImage || null,
        watermark_opacity: opacity,
        watermark_size: size,
        watermark_position: position,
        watermark_spacing: position === "repetido" ? spacing : undefined,
      });
      toast.success("Configurações salvas!");
      onClose();
    } catch {
      toast.error("Erro ao salvar");
    }
    setSaving(false);
  };

  const previewEvento: Evento = {
    ...evento,
    watermark_enabled: enabled,
    watermark_image: watermarkImage,
    watermark_opacity: opacity,
    watermark_size: size,
    watermark_position: position,
    watermark_spacing: position === "repetido" ? spacing : 20,
  };

  const optionClass = (active: boolean) =>
    cn(
      "min-h-10 rounded-lg border px-3 py-2 text-[14px] font-medium transition-colors duration-150",
      active
        ? "border-primary bg-primary text-primary-foreground"
        : "border-input bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
    );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden rounded-xl bg-card p-0 sm:max-w-4xl sm:rounded-xl sm:p-0">
        <div className="border-b border-border px-5 py-4 pr-12">
          <DialogTitle className="text-[17px] font-semibold text-foreground">Configurações de marca d'água</DialogTitle>
          <DialogDescription className="mt-0.5 text-[14px] text-muted-foreground">
            Ajuste como a marca d'água aparece nas fotos públicas deste evento.
          </DialogDescription>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-5 lg:grid-cols-2">
          <div className="min-w-0 space-y-5">
            <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
              <div>
                <label htmlFor="wm-enabled" className="text-[15px] font-medium text-foreground">Marca d'água</label>
                <p className="mt-0.5 text-[13px] text-muted-foreground">Exibir marca d'água nas fotos públicas</p>
              </div>
              <Switch id="wm-enabled" checked={enabled} onCheckedChange={(v) => setEnabled(v)} />
            </div>

            <div className="space-y-3">
              <SectionLabel>Imagem da marca d'água</SectionLabel>
              {watermarkImage ? (
                <div className="relative overflow-hidden rounded-lg border border-border bg-muted">
                  <img src={watermarkImage} alt="Imagem da marca d'água" className="h-32 w-full object-contain" />
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => { setWatermarkImage(""); setEnabled(false); }}
                    className="absolute right-2 top-2"
                    aria-label="Remover imagem da marca d'água"
                  >
                    <X />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full flex-col items-center rounded-lg border-2 border-dashed border-input bg-background px-4 py-8 text-center transition-colors duration-150 hover:border-muted-foreground hover:bg-accent disabled:cursor-wait disabled:opacity-60"
                >
                  {uploading ? (
                    <Loader2 className="mb-2 h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
                  ) : (
                    <Upload className="mb-2 h-6 w-6 text-muted-foreground" aria-hidden="true" />
                  )}
                  <span className="text-[14px] font-medium text-foreground">
                    {uploading ? "Enviando…" : "Clique para enviar PNG"}
                  </span>
                  <span className="mt-1 text-[13px] text-muted-foreground">Transparente, até 2 MB</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png"
                onChange={(e) => handleUpload(e.target.files?.[0] || null)}
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <SectionLabel>
                  <span id="wm-opacity-label">Opacidade</span>
                </SectionLabel>
                <span className="text-[14px] tabular-nums text-foreground">{opacity}%</span>
              </div>
              <Slider
                min={5}
                max={100}
                step={1}
                value={[opacity]}
                onValueChange={(v) => setOpacity(Number(v[0]))}
                aria-labelledby="wm-opacity-label"
                className="py-2"
              />
              <div className="flex justify-between text-[12px] text-muted-foreground">
                <span>5%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="space-y-3">
              <SectionLabel>Tamanho</SectionLabel>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="Tamanho">
                {sizes.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={size === s.value}
                    onClick={() => setSize(s.value)}
                    className={optionClass(size === s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <SectionLabel>Posição</SectionLabel>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Posição">
                {positions.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    aria-pressed={position === p.value}
                    onClick={() => setPosition(p.value)}
                    className={optionClass(position === p.value)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {position === "repetido" && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <SectionLabel>
                      <span id="wm-spacing-label">Espaçamento</span>
                    </SectionLabel>
                    <span className="text-[14px] tabular-nums text-foreground">{spacing}%</span>
                  </div>
                  <Slider
                    min={5}
                    max={50}
                    step={1}
                    value={[spacing]}
                    onValueChange={(v) => setSpacing(Number(v[0]))}
                    aria-labelledby="wm-spacing-label"
                    className="py-2"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 space-y-3 lg:sticky lg:top-0 lg:self-start">
            <SectionLabel className="flex items-center gap-2">
              <Eye className="h-4 w-4" aria-hidden="true" /> Prévia em tempo real
            </SectionLabel>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={evento.capa_url || "https://placehold.co/800x600/1a1a1a/666?text=Foto+de+Exemplo"}
                alt="Prévia da marca d'água sobre a foto"
                className="h-full w-full object-cover"
              />
              {enabled && watermarkImage && (
                position === "repetido" ? (
                  <div
                    className="pointer-events-none absolute inset-0 select-none"
                    style={{
                      backgroundImage: `url(${watermarkImage})`,
                      backgroundRepeat: "repeat",
                      backgroundSize: `${spacing}%`,
                      opacity: opacity / 100,
                    }}
                  />
                ) : (
                  <div
                    className="pointer-events-none absolute inset-0 flex select-none"
                    style={{
                      justifyContent: position.includes("direita") ? "flex-end" : position.includes("esquerda") ? "flex-start" : "center",
                      alignItems: position.includes("inferior") ? "flex-end" : position.includes("superior") ? "flex-start" : "center",
                    }}
                  >
                    <img
                      src={watermarkImage}
                      alt=""
                      style={{
                        width: { pequena: "12%", media: "25%", grande: "45%" }[size],
                        opacity: opacity / 100,
                      }}
                      className="pointer-events-none select-none"
                    />
                  </div>
                )
              )}
              {(!enabled || !watermarkImage) && (
                <div className="absolute inset-0 flex items-center justify-center p-4">
                  <p className="rounded-md bg-background/90 px-3 py-1.5 text-[14px] text-muted-foreground">
                    {!watermarkImage ? "Envie uma marca d'água" : "Marca d'água desativada"}
                  </p>
                </div>
              )}
            </div>
            <p className="text-center text-[13px] text-muted-foreground">
              As alterações aparecem aqui na hora.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
            {saving ? "Salvando…" : "Salvar configurações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
