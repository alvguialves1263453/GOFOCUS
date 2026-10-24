import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Foto } from "@/types/eventos";
import { toast } from "sonner";

export function useFotos(eventoId: string | undefined) {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFotos = useCallback(async () => {
    if (!eventoId) { setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from("fotos")
      .select("*")
      .eq("evento_id", eventoId)
      .order("ordem", { ascending: true });

    if (error) {
      console.error("Erro ao buscar fotos:", error);
      toast.error("Erro ao carregar fotos");
    } else if (data) {
      setFotos(data as Foto[]);
    }
    setLoading(false);
  }, [eventoId]);

  useEffect(() => {
    fetchFotos();
  }, [fetchFotos]);

  const addFotos = async (novasFotos: Omit<Foto, "id" | "evento_id">[]) => {
    if (!eventoId) return;
    const records = novasFotos.map((f, i) => ({
      evento_id: eventoId,
      ...f,
      ordem: fotos.length + i,
    }));
    const { data, error } = await supabase.from("fotos").insert(records).select();
    if (error) {
      toast.error("Erro ao salvar fotos no banco");
      return null;
    }
    if (data) {
      setFotos((prev) => [...prev, ...(data as Foto[])]);
    }
    return data as Foto[];
  };

  const deleteFotos = async (ids: string[]) => {
    const { error } = await supabase.from("fotos").delete().in("id", ids);
    if (error) {
      toast.error("Erro ao excluir fotos");
      return false;
    }
    setFotos((prev) => prev.filter((f) => !ids.includes(f.id)));
    toast.success(`${ids.length} foto(s) excluída(s)`);
    return true;
  };

  const updateOrdem = async (reordenadas: { id: string; ordem: number }[]) => {
    for (const item of reordenadas) {
      await supabase.from("fotos").update({ ordem: item.ordem }).eq("id", item.id);
    }
    setFotos((prev) => {
      const map = new Map(reordenadas.map((r) => [r.id, r.ordem]));
      return prev.map((f) => (map.has(f.id) ? { ...f, ordem: map.get(f.id)! } : f));
    });
  };

  const setCapa = async (fotoUrl: string) => {
    if (!eventoId) return;
    const { error } = await supabase
      .from("eventos")
      .update({ capa_url: fotoUrl })
      .eq("id", eventoId);
    if (error) toast.error("Erro ao definir capa");
    else toast.success("Capa atualizada!");
  };

  return {
    fotos,
    loading,
    addFotos,
    deleteFotos,
    updateOrdem,
    setCapa,
    refetch: fetchFotos,
  };
}
