import { Search, Filter, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface DemandasFiltersProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  prioridadeFilter: string;
  setPrioridadeFilter: (val: string) => void;
  onNew: () => void;
}

export function DemandasFilters({
  searchQuery, setSearchQuery,
  statusFilter, setStatusFilter,
  prioridadeFilter, setPrioridadeFilter,
  onNew
}: DemandasFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
        {/* Busca */}
        <div className="relative w-full sm:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
           <input 
              type="text" 
              placeholder="Buscar cliente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/3 border border-white/8 pl-9 pr-4 py-2 text-[11px] rounded-sm focus:outline-none focus:border-white/20 transition-colors text-white placeholder:text-white/30"
           />
        </div>
        
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-[34px] bg-white/3 border-white/8 text-[10px] w-full sm:w-[130px] focus:ring-0 text-white">
              <Filter className="h-3 w-3 mr-2 text-white/20" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10 text-white">
              <SelectItem value="all" className="text-[10px] uppercase">Todos Status</SelectItem>
              <SelectItem value="novo" className="text-[10px] uppercase">Novo</SelectItem>
              <SelectItem value="orçamento" className="text-[10px] uppercase">Orçamento</SelectItem>
              <SelectItem value="em produção" className="text-[10px] uppercase">Em Produção</SelectItem>
              <SelectItem value="revisão" className="text-[10px] uppercase">Revisão</SelectItem>
              <SelectItem value="entregue" className="text-[10px] uppercase">Entregue</SelectItem>
              <SelectItem value="cancelado" className="text-[10px] uppercase">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="h-[34px] bg-white/3 border-white/8 text-[10px] w-full sm:w-[130px] focus:ring-0 text-white">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10 text-white">
              <SelectItem value="all" className="text-[10px] uppercase">Todas</SelectItem>
              <SelectItem value="baixa" className="text-[10px] uppercase">Baixa</SelectItem>
              <SelectItem value="média" className="text-[10px] uppercase">Média</SelectItem>
              <SelectItem value="alta" className="text-[10px] uppercase">Alta</SelectItem>
              <SelectItem value="urgente" className="text-[10px] uppercase">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <button
          onClick={onNew}
          className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-[9px] font-semibold uppercase tracking-wider rounded-sm transition-all duration-300 bg-white text-black hover:opacity-80"
        >
          <Plus className="h-3 w-3" />
          Nova Demanda
        </button>
      </div>
    </div>
  );
}
