import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { EventoComFotos } from "@/types/eventos";
import { toast } from "sonner";

export function useEventos() {
  const [eventos, setEventos] = useState<EventoComFotos[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");

  const fetchEventos = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("eventos")
      .select("*, fotos(count)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "todos") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Erro ao buscar eventos:", error);
      toast.error("Erro ao carregar eventos");
    } else if (data) {
      const mapped: EventoComFotos[] = data.map((ev: any) => ({
        id: ev.id,
        titulo: ev.titulo,
        descricao: ev.descricao,
        data_evento: ev.data_evento,
        local: ev.local,
        capa_url: ev.capa_url,
        preco_foto: ev.preco_foto,
        status: ev.status,
        created_at: ev.created_at,
        foto_count: ev.fotos?.[0]?.count ?? 0,
      }));
      setEventos(mapped);
    }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const filtered = search
    ? eventos.filter((e) =>
        e.titulo.toLowerCase().includes(search.toLowerCase()) ||
        (e.local?.toLowerCase().includes(search.toLowerCase()))
      )
    : eventos;

  const deleteEvento = async (id: string) => {
    const { error } = await supabase.from("eventos").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir evento");
      return false;
    }
    setEventos((prev) => prev.filter((e) => e.id !== id));
    toast.success("Evento excluído");
    return true;
  };

  return {
    eventos: filtered,
    allEventos: eventos,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    deleteEvento,
    refetch: fetchEventos,
  };
}
