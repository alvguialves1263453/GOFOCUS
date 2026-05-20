import { Demanda } from '@/hooks/useDemandas';
import { Edit2, Trash2, Calendar as CalendarIcon, Instagram, Phone, Building2, User, FileText, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DemandasListProps {
  demandas: Demanda[];
  onEdit: (demanda: Demanda) => void;
  onDelete: (id: string) => void;
}

const statusColors: Record<string, string> = {
  'novo': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'orçamento': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'em produção': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'revisão': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  'entregue': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'cancelado': 'bg-red-500/10 text-red-400 border-red-500/20',
};

const prioridadeColors: Record<string, string> = {
  'baixa': 'text-white/40',
  'média': 'text-blue-400/80',
  'alta': 'text-amber-400',
  'urgente': 'text-red-400 font-bold',
};

export function DemandasList({ demandas, onEdit, onDelete }: DemandasListProps) {
  
  if (demandas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 border border-dashed border-white/8 rounded-sm bg-white/2">
        <FileText className="h-8 w-8 text-white/10 mb-4" strokeWidth={1} />
        <p className="text-[10px] uppercase tracking-[0.4em] text-white/20">Nenhuma demanda encontrada.</p>
      </div>
    );
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <div className="space-y-3">
      {demandas.map((demanda) => (
        <div 
          key={demanda.id} 
          className="group relative bg-[#0f0f0f] border border-white/5 hover:border-white/15 rounded-sm p-4 sm:p-5 transition-all"
        >
          {/* Header row: Titulo + Badges */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base sm:text-lg font-serif text-white">{demanda.titulo}</h3>
                <span className={`text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-sm border ${statusColors[demanda.status]}`}>
                  {demanda.status}
                </span>
                {demanda.pago && (
                  <span className="text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" /> Pago
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 line-clamp-2">
                {demanda.descricao || 'Nenhuma descrição fornecida.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-start opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onEdit(demanda)}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/40 hover:text-white rounded-sm transition-colors"
                title="Editar"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja apagar esta demanda?')) {
                    onDelete(demanda.id);
                  }
                }}
                className="p-2 bg-red-500/5 hover:bg-red-500/10 text-red-400/40 hover:text-red-400 rounded-sm transition-colors"
                title="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
            {/* Cliente Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest">
                <User className="h-3 w-3" /> Cliente
              </div>
              <div className="text-xs text-white/80 font-medium">{demanda.nome_cliente}</div>
              {demanda.empresa && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <Building2 className="h-3 w-3" /> {demanda.empresa}
                </div>
              )}
              {demanda.instagram && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <Instagram className="h-3 w-3" /> {demanda.instagram}
                </div>
              )}
              {demanda.whatsapp && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <Phone className="h-3 w-3" /> {demanda.whatsapp}
                </div>
              )}
            </div>

            {/* Detalhes do Serviço */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest">
                <FileText className="h-3 w-3" /> Serviço
              </div>
              <div className="text-xs text-white/80">
                <span className="text-white/40 mr-1">Cat:</span> {demanda.categoria}
              </div>
              <div className={`text-xs ${prioridadeColors[demanda.prioridade]}`}>
                <span className="text-white/40 mr-1">Prio:</span> {demanda.prioridade.toUpperCase()}
              </div>
              <div className="text-xs text-emerald-400 font-medium mt-1">
                {formatCurrency(demanda.valor)}
              </div>
            </div>

            {/* Prazos */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest">
                <CalendarIcon className="h-3 w-3" /> Datas
              </div>
              <div className="text-[11px] text-white/60">
                <span className="text-white/30 block mb-0.5">Criado em:</span>
                {formatDate(demanda.created_at)}
              </div>
              {demanda.prazo_entrega && (
                <div className="text-[11px] text-amber-400/80 mt-1">
                  <span className="text-white/30 block mb-0.5">Prazo:</span>
                  {formatDate(demanda.prazo_entrega)}
                </div>
              )}
            </div>

            {/* Observações */}
            {demanda.observacoes && (
              <div className="space-y-2 col-span-2 md:col-span-1">
                <div className="flex items-center gap-1.5 text-[10px] text-white/30 uppercase tracking-widest">
                  Notas Internas
                </div>
                <div className="text-[11px] text-white/50 bg-white/5 p-2 rounded-sm line-clamp-4">
                  {demanda.observacoes}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
