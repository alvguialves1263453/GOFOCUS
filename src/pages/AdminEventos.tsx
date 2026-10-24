import { Link, useNavigate } from "react-router-dom";
import { Plus, Search, Calendar, MapPin, Image, Edit2, Trash2 } from "lucide-react";
import { useEventos } from "@/hooks/useEventos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AdminPage, EmptyState, Segmented, StatusBadge } from "@/components/admin/ui";

const statusConfig: Record<string, { label: string; tone: "warning" | "success" | "neutral" }> = {
  rascunho: { label: "Rascunho", tone: "warning" },
  ativo: { label: "Ativo", tone: "success" },
  arquivado: { label: "Arquivado", tone: "neutral" },
};

const filterOptions = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativo" },
  { value: "rascunho", label: "Rascunho" },
  { value: "arquivado", label: "Arquivado" },
];

export default function AdminEventos() {
  const navigate = useNavigate();
  const {
    eventos, loading, search, setSearch,
    statusFilter, setStatusFilter, deleteEvento,
  } = useEventos();

  const handleDelete = async (id: string, titulo: string) => {
    if (!confirm(`Excluir o evento "${titulo}"?`)) return;
    await deleteEvento(id);
  };

  return (
    <AdminPage
      title="Eventos"
      description={`${eventos.length} evento${eventos.length !== 1 ? "s" : ""} cadastrado${eventos.length !== 1 ? "s" : ""}`}
      actions={
        <Button onClick={() => navigate("/admin/eventos/novo")}>
          <Plus aria-hidden="true" /> Novo evento
        </Button>
      }
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou local…"
            aria-label="Buscar eventos por nome ou local"
            className="pl-9"
          />
        </div>
        <Segmented
          label="Filtrar por status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={filterOptions}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-border bg-card">
              <Skeleton className="aspect-video rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : eventos.length === 0 ? (
        <EmptyState
          icon={<Image />}
          title={search ? "Nenhum evento encontrado" : "Nenhum evento cadastrado"}
          description={search ? "Tente outro nome ou local." : undefined}
          action={
            !search && (
              <Button variant="secondary" onClick={() => navigate("/admin/eventos/novo")}>
                <Plus aria-hidden="true" /> Criar primeiro evento
              </Button>
            )
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((evento) => {
            const cfg = statusConfig[evento.status] || statusConfig.rascunho;
            const href = `/admin/eventos/${evento.id}`;

            return (
              <li
                key={evento.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors duration-150 hover:border-input"
              >
                <Link to={href} tabIndex={-1} aria-hidden="true" className="relative block aspect-video overflow-hidden bg-muted">
                  {evento.capa_url ? (
                    <img src={evento.capa_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Image className="h-8 w-8" strokeWidth={1.5} />
                    </div>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="min-w-0 text-[17px] font-semibold text-foreground">
                      <Link
                        to={href}
                        className="line-clamp-1 rounded-sm transition-colors duration-150 hover:text-muted-foreground"
                      >
                        {evento.titulo}
                      </Link>
                    </h2>
                    <StatusBadge tone={cfg.tone} className="shrink-0">{cfg.label}</StatusBadge>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[14px] text-muted-foreground">
                    {evento.data_evento && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        {new Date(evento.data_evento).toLocaleDateString("pt-BR")}
                      </span>
                    )}
                    {evento.local && (
                      <span className="flex min-w-0 items-center gap-1.5">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{evento.local}</span>
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
                    <span className="flex items-center gap-1.5 text-[14px] text-muted-foreground">
                      <Image className="h-4 w-4" aria-hidden="true" />
                      {evento.foto_count} foto{evento.foto_count !== 1 ? "s" : ""}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(href)}
                        aria-label={`Editar ${evento.titulo}`}
                        title="Editar"
                      >
                        <Edit2 />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(evento.id, evento.titulo)}
                        aria-label={`Excluir ${evento.titulo}`}
                        title="Excluir"
                        className="text-destructive hover:bg-destructive/15 hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPage>
  );
}
