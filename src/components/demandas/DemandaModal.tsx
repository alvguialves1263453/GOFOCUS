import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Demanda, NewDemanda, Prioridade, StatusDemanda } from '@/hooks/useDemandas';
import { Loader2, Save, X, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Checkbox } from '@/components/ui/checkbox';

interface DemandaModalProps {
  isOpen: boolean;
  onClose: () => void;
  demandaToEdit?: Demanda | null;
  onSave: (demanda: NewDemanda | Demanda) => Promise<void>;
}

const initialForm: NewDemanda = {
  nome_cliente: '',
  empresa: '',
  instagram: '',
  whatsapp: '',
  titulo: '',
  descricao: '',
  categoria: '',
  prioridade: 'baixa',
  status: 'novo',
  valor: 0,
  pago: false,
  prazo_entrega: '',
  observacoes: ''
};

export function DemandaModal({ isOpen, onClose, demandaToEdit, onSave }: DemandaModalProps) {
  const [formData, setFormData] = useState<NewDemanda | Demanda>(initialForm);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (demandaToEdit) {
      setFormData({
        ...demandaToEdit,
        prazo_entrega: demandaToEdit.prazo_entrega ? demandaToEdit.prazo_entrega.split('T')[0] : ''
      });
    } else {
      setFormData(initialForm);
    }
  }, [demandaToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <DialogHeader className="p-6 pb-4 border-b border-white/5 shrink-0 flex flex-row items-center justify-between">
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/30 mb-1">
              {demandaToEdit ? 'Editando Demanda' : 'Nova Demanda'}
            </p>
            <DialogTitle className="font-serif text-xl font-normal">
              {demandaToEdit ? 'Atualizar Pedido' : 'Cadastrar Pedido'}
            </DialogTitle>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white bg-white/5 rounded-sm transition-colors">
            <X className="h-4 w-4" />
          </button>
        </DialogHeader>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="demanda-form" onSubmit={handleSubmit} className="space-y-8">
            {/* Informações do Cliente */}
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-white/20"></span> Informações do Cliente
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Nome Completo *</label>
                  <input required name="nome_cliente" value={formData.nome_cliente} onChange={handleChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Empresa</label>
                  <input name="empresa" value={formData.empresa || ''} onChange={handleChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Instagram</label>
                  <input name="instagram" placeholder="@" value={formData.instagram || ''} onChange={handleChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">WhatsApp</label>
                  <input name="whatsapp" value={formData.whatsapp || ''} onChange={handleChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30" />
                </div>
              </div>
            </div>

            {/* Detalhes da Demanda */}
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-white/20"></span> Detalhes da Demanda
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Título *</label>
                  <input required name="titulo" placeholder="Ex: Criação de Cardápio Digital" value={formData.titulo} onChange={handleChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Categoria *</label>
                  <input required name="categoria" placeholder="Ex: Design, Social Media, Ads" value={formData.categoria} onChange={handleChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Prazo de Entrega</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        type="button"
                        className={`w-full bg-[#111] border border-white/10 px-3 py-2 h-[38px] text-sm rounded-sm text-left flex items-center justify-between hover:bg-[#1a1a1a] transition-colors focus:outline-none focus:border-white/30 ${!formData.prazo_entrega ? 'text-white/30' : 'text-white'}`}
                      >
                        {formData.prazo_entrega ? format(parseISO(formData.prazo_entrega), 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione a data'}
                        <CalendarIcon className="h-4 w-4 opacity-50" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-[#111] border-white/10" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.prazo_entrega ? parseISO(formData.prazo_entrega) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Evitar offset timezone local alterando a data
                            const offset = date.getTimezoneOffset();
                            const adjustedDate = new Date(date.getTime() - (offset * 60 * 1000));
                            setFormData(prev => ({ ...prev, prazo_entrega: adjustedDate.toISOString().split('T')[0] }));
                          } else {
                            setFormData(prev => ({ ...prev, prazo_entrega: '' }));
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Prioridade *</label>
                  <Select value={formData.prioridade} onValueChange={(val) => handleSelectChange('prioridade', val)}>
                    <SelectTrigger className="w-full bg-[#111] border-white/10 text-sm h-[38px] rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10 text-white">
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Status *</label>
                  <Select value={formData.status} onValueChange={(val) => handleSelectChange('status', val)}>
                    <SelectTrigger className="w-full bg-[#111] border-white/10 text-sm h-[38px] rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#111] border-white/10 text-white">
                      <SelectItem value="novo">Novo</SelectItem>
                      <SelectItem value="orçamento">Orçamento</SelectItem>
                      <SelectItem value="em produção">Em Produção</SelectItem>
                      <SelectItem value="revisão">Revisão</SelectItem>
                      <SelectItem value="entregue">Entregue</SelectItem>
                      <SelectItem value="cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5 mb-4">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">Descrição</label>
                <textarea name="descricao" rows={3} value={formData.descricao || ''} onChange={handleChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30 resize-none" />
              </div>
            </div>

            {/* Financeiro & Extras */}
            <div>
              <h4 className="text-[10px] uppercase tracking-widest text-white/50 mb-4 flex items-center gap-2">
                <span className="w-4 h-px bg-white/20"></span> Financeiro & Extras
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-white/40 uppercase tracking-wider">Valor (R$)</label>
                  <input type="number" step="0.01" name="valor" value={formData.valor || ''} onChange={handleNumberChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30" />
                </div>
                <div className="flex items-center space-x-2 h-full pt-4">
                  <Checkbox 
                    id="pago" 
                    checked={formData.pago} 
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pago: checked === true }))}
                    className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                  />
                  <label htmlFor="pago" className="text-sm font-medium leading-none text-white/80 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                    Serviço Pago
                  </label>
                </div>
              </div>

              <div className="space-y-1.5 mb-2">
                <label className="text-[10px] text-white/40 uppercase tracking-wider">Observações Internas</label>
                <textarea name="observacoes" rows={2} value={formData.observacoes || ''} onChange={handleChange} className="w-full bg-[#111] border border-white/10 px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-white/30 resize-none" />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 pt-4 border-t border-white/5 shrink-0 flex justify-end gap-3 bg-[#0a0a0a]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="demanda-form"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-white text-black text-[10px] font-semibold uppercase tracking-wider rounded-sm transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {isSaving ? 'Salvando...' : 'Salvar Demanda'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
