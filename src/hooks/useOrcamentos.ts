import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  getOrcamentosAsync,
  saveOrcamentoAsync,
  updateOrcamentoAsync,
  deleteOrcamentoAsync,
  type Orcamento,
  type NewOrcamento,
} from '@/lib/orcamentosStorage';

export function useOrcamentos() {
  const queryClient = useQueryClient();

  const { data: orcamentos = [], isLoading, error } = useQuery({
    queryKey: ['orcamentos'],
    queryFn: async () => {
      const data = await getOrcamentosAsync();
      return data;
    },
  });

  const createOrcamento = useMutation({
    mutationFn: async (newOrcamento: NewOrcamento) => {
      const result = await saveOrcamentoAsync(newOrcamento);
      if (result.error) throw new Error(result.error);
      return result.data!;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      if (data) {
        return data;
      }
    },
    onError: (error: any) => {
      toast.error('Erro ao criar orçamento: ' + error.message);
    },
  });

  const updateOrcamento = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Orcamento> & { id: string }) => {
      await updateOrcamentoAsync(id, updates);
      return { id, ...updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento atualizado!');
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar orçamento: ' + error.message);
    },
  });

  const deleteOrcamento = useMutation({
    mutationFn: async (id: string) => {
      await deleteOrcamentoAsync(id);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orcamentos'] });
      toast.success('Orçamento excluído!');
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir orçamento: ' + error.message);
    },
  });

  return {
    orcamentos,
    isLoading,
    error,
    createOrcamento,
    updateOrcamento,
    deleteOrcamento,
  };
}
