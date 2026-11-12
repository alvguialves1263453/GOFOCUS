import { useState } from "react";
import { Image, Trash2, CheckSquare, Crown, ExternalLink, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/admin/ui";
import { cn } from "@/lib/utils";
import type { Foto } from "@/types/eventos";

interface PhotoGalleryProps {
  fotos: Foto[];
  capaUrl: string | null;
  loading?: boolean;
  onDelete: (ids: string[]) => void;
  onSetCapa: (url: string) => void;
  onReorder?: (items: { id: string; ordem: number }[]) => void;
}

export default function PhotoGallery({
  fotos,
  capaUrl,
  loading,
  onDelete,
  onSetCapa,
  onReorder,
}: PhotoGalleryProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === fotos.length) setSelected(new Set());
    else setSelected(new Set(fotos.map((f) => f.id)));
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    onDelete(Array.from(selected));
    setSelected(new Set());
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" aria-busy="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
        ))}
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <EmptyState
        icon={<Image />}
        title="Nenhuma foto neste evento"
        description="Envie fotos pela área acima para montar a galeria."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="ghost" size="sm" onClick={selectAll} className="-ml-2">
            <CheckSquare aria-hidden="true" />
            {selected.size === fotos.length ? "Desmarcar todas" : `Selecionar todas (${fotos.length})`}
          </Button>
          {selected.size > 0 && (
            <span className="text-[14px] text-muted-foreground" aria-live="polite">
              {selected.size} selecionada(s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteSelected}
              className="bg-destructive/15 text-destructive hover:bg-destructive/25 hover:text-destructive"
            >
              <Trash2 aria-hidden="true" />
              Excluir {selected.size}
            </Button>
          )}
          <span className="text-[14px] tabular-nums text-muted-foreground">
            {fotos.length} foto{fotos.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {fotos.map((foto, idx) => {
          const isSelected = selected.has(foto.id);
          const isCapa = capaUrl && (foto.url_original === capaUrl || foto.url_thumbnail === capaUrl);

          return (
            <li
              key={foto.id}
              style={{ animationDelay: `${Math.min(idx, 12) * 25}ms` }}
              className={cn(
                "photo-in group relative aspect-[3/4] overflow-hidden rounded-lg border-2 bg-muted transition-colors duration-150",
                isSelected
                  ? "border-primary"
                  : isCapa
                  ? "border-[hsl(var(--admin-success))]"
                  : "border-transparent hover:border-input"
              )}
            >
              <button
                type="button"
                onClick={() => toggleSelect(foto.id)}
                aria-pressed={isSelected}
                aria-label={`${isSelected ? "Desmarcar" : "Selecionar"} foto ${idx + 1}`}
                className="absolute inset-0 h-full w-full cursor-pointer focus-visible:outline-offset-[-4px]"
              >
                <img
                  src={foto.url_thumbnail || foto.url_original}
                  alt={`Foto ${idx + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>

              {isCapa && (
                <div className="pointer-events-none absolute left-2 top-2 flex items-center gap-1 rounded-md bg-background/90 px-2 py-0.5 text-[12px] font-medium text-[hsl(var(--admin-success))]">
                  <Crown className="h-3.5 w-3.5" aria-hidden="true" />
                  Capa
                </div>
              )}

              <div className="absolute right-1.5 top-1.5 flex flex-col gap-1.5 transition-opacity duration-150 sm:opacity-0 sm:focus-within:opacity-100 sm:group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); onSetCapa(foto.url_original); }}
                  className={cn(
                    "bg-background/90 hover:bg-accent",
                    isCapa && "text-[hsl(var(--admin-success))]"
                  )}
                  aria-label={isCapa ? `Foto ${idx + 1} é a capa` : `Definir foto ${idx + 1} como capa`}
                  title="Definir como capa"
                >
                  <Star className={cn(isCapa && "fill-current")} />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); window.open(foto.url_original, "_blank"); }}
                  className="bg-background/90 hover:bg-accent"
                  aria-label={`Abrir original da foto ${idx + 1}`}
                  title="Abrir original"
                >
                  <ExternalLink />
                </Button>
              </div>

              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute bottom-2 left-2 h-5 w-5 rounded border-2 transition-colors duration-150",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-foreground/70 bg-background/50 group-hover:border-foreground"
                )}
              >
                {isSelected && (
                  <svg viewBox="0 0 16 16" className="h-full w-full p-0.5">
                    <polyline points="3,8 7,12 13,4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
