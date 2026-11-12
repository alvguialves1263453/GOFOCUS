import { useState, useEffect, useCallback } from "react";
import { supabase, supabaseAnon } from "@/lib/supabase";
import { EventoComFotos } from "@/types/eventos";
import { toast } from "sonner";

type DeleteError = { code?: string; message?: string; details?: string } | null;

const isAuthError = (error: DeleteError) =>
  !!error && (
    error.code === "PGRST301" ||
    error.code === "42501" ||
    /jwt|permission|row-level security|not authorized/i.test(error.message || "")
  );

const isForeignKeyError = (error: DeleteError) => !!error && error.code === "23503";

const mentionsFotos = (error: DeleteError) =>
  /fotos/i.test(`${error?.message ?? ""} ${error?.details ?? ""}`);

const mentionsPedidos = (error: DeleteError) =>
  /pedidos/i.test(`${error?.message ?? ""} ${error?.details ?? ""}`);

async function deleteRowsWithFallback(
  table: "eventos" | "fotos" | "pedidos",
  column: "id" | "evento_id",
  value: string
) {
  let result = await supabase.from(table).delete({ count: "exact" }).eq(column, value);
  let error = result.error;
  let deleted = result.count ?? 0;

  if (isAuthError(error) || (!error && deleted === 0)) {
    result = await supabaseAnon.from(table).delete({ count: "exact" }).eq(column, value);
    error = result.error;
    deleted = result.count ?? 0;
  }

  return { error, deleted };
}

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
    const { count } = await supabase
      .from("pedidos")
      .select("id", { count: "exact", head: true })
      .eq("evento_id", id);
    const pedidoCount = count ?? 0;
    let pedidosConfirmed = false;

    if (pedidoCount > 0) {
      pedidosConfirmed = window.confirm(
        `Este evento possui ${pedidoCount} pedido(s) vinculado(s). Excluir o evento também apagará esses pedidos do histórico. Deseja continuar?`
      );
      if (!pedidosConfirmed) {
        toast.info("Exclusão cancelada. O evento foi mantido.");
        return false;
      }
    }

    let result = await deleteRowsWithFallback("eventos", "id", id);
    let fotosDeleted = false;
    let pedidosDeleted = false;

    for (let attempt = 0; attempt < 3 && result.error && isForeignKeyError(result.error); attempt++) {
      if (mentionsFotos(result.error) && !fotosDeleted) {
        fotosDeleted = true;
        const fotos = await deleteRowsWithFallback("fotos", "evento_id", id);
        if (fotos.error) {
          toast.error(`Erro ao excluir fotos do evento: ${fotos.error.message}`);
          return false;
        }
      } else if (mentionsPedidos(result.error) && !pedidosDeleted) {
        pedidosDeleted = true;
        if (!pedidosConfirmed) {
          pedidosConfirmed = window.confirm(
            "Este evento possui pedidos vinculados. Excluir o evento também apagará esses pedidos do histórico. Deseja continuar?"
          );
          if (!pedidosConfirmed) {
            toast.info("Exclusão cancelada. O evento foi mantido.");
            return false;
          }
        }
        const pedidos = await deleteRowsWithFallback("pedidos", "evento_id", id);
        if (pedidos.error) {
          toast.error(`Erro ao excluir pedidos do evento: ${pedidos.error.message}`);
          return false;
        }
      } else {
        break;
      }
      result = await deleteRowsWithFallback("eventos", "id", id);
    }

    if (result.error) {
      const fkBlocked = isForeignKeyError(result.error);
      const message = fkBlocked && pedidosDeleted && mentionsPedidos(result.error)
        ? "não foi possível apagar os pedidos vinculados. Arquive o evento em vez de excluí-lo."
        : fkBlocked && fotosDeleted && mentionsFotos(result.error)
        ? "não foi possível apagar as fotos vinculadas."
        : result.error.message;
      toast.error(`Erro ao excluir evento: ${message}`);
      return false;
    }

    if (result.deleted === 0) {
      const { data } = await supabaseAnon
        .from("eventos")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (data) {
        toast.error("Erro ao excluir evento: sem permissão. Faça login novamente.");
        return false;
      }
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
