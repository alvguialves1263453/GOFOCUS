import { Demanda } from '@/hooks/useDemandas';
import { DollarSign, CheckCircle2, Clock, ListTodo, AlertCircle } from 'lucide-react';

interface DemandasDashboardProps {
  demandas: Demanda[];
}

export function DemandasDashboard({ demandas }: DemandasDashboardProps) {
  const total = demandas.length;
  
  const andamentoStatus = ['novo', 'orçamento', 'em produção', 'revisão'];
  const emAndamento = demandas.filter(d => andamentoStatus.includes(d.status)).length;
  
  const entregues = demandas.filter(d => d.status === 'entregue').length;
  
  const pendentesPagamento = demandas.filter(d => !d.pago && d.status !== 'cancelado').length;
  
  const faturamentoTotal = demandas
    .filter(d => d.pago && d.status !== 'cancelado')
    .reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

  const faturamentoPendente = demandas
    .filter(d => !d.pago && d.status !== 'cancelado')
    .reduce((acc, d) => acc + (Number(d.valor) || 0), 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {/* Total */}
      <div className="bg-white/3 border border-white/10 rounded-sm p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Total</span>
          <ListTodo className="h-4 w-4 text-white/20" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-serif text-white">{total}</span>
          <span className="text-[9px] text-white/30 mb-1">demandas</span>
        </div>
      </div>

      {/* Em Andamento */}
      <div className="bg-white/3 border border-white/10 rounded-sm p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Andamento</span>
          <Clock className="h-4 w-4 text-blue-400/40" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-serif text-white">{emAndamento}</span>
          <span className="text-[9px] text-white/30 mb-1">ativas</span>
        </div>
      </div>

      {/* Entregues */}
      <div className="bg-white/3 border border-white/10 rounded-sm p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Entregues</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-400/40" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-2xl font-serif text-white">{entregues}</span>
          <span className="text-[9px] text-white/30 mb-1">concluídas</span>
        </div>
      </div>

      {/* Pendentes Pagamento */}
      <div className="bg-white/3 border border-white/10 rounded-sm p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">A Receber</span>
          <AlertCircle className="h-4 w-4 text-amber-400/40" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-serif text-amber-100 truncate" title={formatCurrency(faturamentoPendente)}>{formatCurrency(faturamentoPendente)}</span>
          <span className="text-[9px] text-amber-400/50 mt-1 truncate">{pendentesPagamento} demandas pendentes</span>
        </div>
      </div>

      {/* Faturamento */}
      <div className="bg-white/3 border border-white/10 rounded-sm p-4 flex flex-col justify-between col-span-2 lg:col-span-1">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Faturamento</span>
          <DollarSign className="h-4 w-4 text-emerald-400/40" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-lg font-serif text-emerald-400 truncate" title={formatCurrency(faturamentoTotal)}>{formatCurrency(faturamentoTotal)}</span>
          <span className="text-[9px] text-emerald-400/50 mt-1">recebido</span>
        </div>
      </div>
    </div>
  );
}
