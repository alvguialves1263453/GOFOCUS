import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export type Prioridade = 'baixa' | 'média' | 'alta' | 'urgente';
export type StatusDemanda = 'novo' | 'orçamento' | 'em produção' | 'revisão' | 'entregue' | 'cancelado';

export interface Demanda {
  id: string;
  created_at: string;
  nome_cliente: string;
  empresa: string | null;
  instagram: string | null;
  whatsapp: string | null;
  titulo: string;
  descricao: string | null;
  categoria: string;
  prioridade: Prioridade;
  status: StatusDemanda;
  valor: number | null;
  pago: boolean;
  prazo_entrega: string | null;
  observacoes: string | null;
}

export type NewDemanda = Omit<Demanda, 'id' | 'created_at'>;

export function useDemandas() {
  const queryClient = useQueryClient();

  // Buscar todas as demandas
  const { data: demandas = [], isLoading, error } = useQuery({
    queryKey: ['demandas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        toast.error('Erro ao carregar demandas: ' + error.message);
        throw error;
      }
      return data as Demanda[];
    },
  });

  // Criar demanda
  const createDemanda = useMutation({
    mutationFn: async (newDemanda: NewDemanda) => {
      const { data, error } = await supabase
        .from('demandas')
        .insert([newDemanda])
        .select()
        .single();
      
      if (error) throw error;
      return data as Demanda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success('Demanda criada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar demanda: ' + error.message);
    }
  });

  // Atualizar demanda
  const updateDemanda = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Demanda> & { id: string }) => {
      const { data, error } = await supabase
        .from('demandas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Demanda;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success('Demanda atualizada com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar demanda: ' + error.message);
    }
  });

  // Deletar demanda
  const deleteDemanda = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('demandas')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandas'] });
      toast.success('Demanda excluída com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir demanda: ' + error.message);
    }
  });

  return {
    demandas,
    isLoading,
    error,
    createDemanda,
    updateDemanda,
    deleteDemanda
  };
}
