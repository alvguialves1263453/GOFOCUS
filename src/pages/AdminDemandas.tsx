import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemandas, Demanda } from '@/hooks/useDemandas';
import { DemandasDashboard } from '@/components/demandas/DemandasDashboard';
import { DemandasFilters } from '@/components/demandas/DemandasFilters';
import { DemandasList } from '@/components/demandas/DemandasList';
import { DemandaModal } from '@/components/demandas/DemandaModal';
import { LogOut, ArrowUpRight, ExternalLink, LayoutGrid, Layers, Calendar, Instagram, ListTodo } from 'lucide-react';
import logoImg from '@/assets/logo.png';

export default function AdminDemandas() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  
  const { demandas, isLoading: demandasLoading, createDemanda, updateDemanda, deleteDemanda } = useDemandas();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [prioridadeFilter, setPrioridadeFilter] = useState("all");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [demandaToEdit, setDemandaToEdit] = useState<Demanda | null>(null);

  const filteredDemandas = useMemo(() => {
    return demandas.filter(d => {
      const matchSearch = 
        d.nome_cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.empresa && d.empresa.toLowerCase().includes(searchQuery.toLowerCase())) ||
        d.titulo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' || d.status === statusFilter;
      const matchPrioridade = prioridadeFilter === 'all' || d.prioridade === prioridadeFilter;

      return matchSearch && matchStatus && matchPrioridade;
    });
  }, [demandas, searchQuery, statusFilter, prioridadeFilter]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleOpenModal = (demanda?: Demanda) => {
    setDemandaToEdit(demanda || null);
    setIsModalOpen(true);
  };

  const handleSave = async (formData: any) => {
    if ('id' in formData && formData.id) {
      await updateDemanda.mutateAsync(formData);
    } else {
      await createDemanda.mutateAsync(formData);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteDemanda.mutateAsync(id);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">Autenticando…</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── TOP BAR ── */}
      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <img src={logoImg} alt="GoFocus" className="h-6 w-auto object-contain" />
            <span className="hidden sm:block text-white/15">|</span>
            <span className="hidden xs:block text-[8px] sm:text-[9px] uppercase tracking-[0.4em] text-white/30 font-medium whitespace-nowrap">
              Painel Admin
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <a
              href="/links"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 border border-white/10 rounded-sm text-[9px] uppercase tracking-[0.3em] text-white hover:bg-white hover:text-black transition-colors"
            >
              Página de Links
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 rounded-sm text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/50 hover:text-white transition-colors"
            >
              <span className="hidden xs:inline">Ver Site</span>
              <ExternalLink className="h-3 w-3 sm:hidden" />
              <ArrowUpRight className="hidden sm:block h-3 w-3" />
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[8px] sm:text-[9px] uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/35 hover:text-white transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">
        {/* ── PAGE TITLE + TABS ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.45em] text-white/30 mb-2 font-medium">Administração</p>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-white">Gestão de Demandas</h1>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center border border-white/10 rounded-sm overflow-hidden self-start w-full sm:w-auto overflow-x-auto custom-scrollbar">
            <button
              onClick={() => navigate("/admin/dashboard?tab=projects")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all text-white/40 hover:text-white/70 whitespace-nowrap"
            >
              <LayoutGrid className="h-3 w-3" />
              Projetos
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=categories")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 text-white/40 hover:text-white/70 whitespace-nowrap"
            >
              <Layers className="h-3 w-3" />
              Categorias
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=planner")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 text-white/40 hover:text-white/70 whitespace-nowrap"
            >
              <Calendar className="h-3 w-3" />
              Planner
            </button>
            <button
              onClick={() => navigate("/admin/instagram")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 text-white/40 hover:text-white/70 whitespace-nowrap"
            >
              <Instagram className="h-3 w-3" />
              Instagram
            </button>
            <button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 bg-white text-black shadow-lg whitespace-nowrap"
            >
              <ListTodo className="h-3 w-3" />
              Demandas
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <DemandasDashboard demandas={demandas} />
          
          <DemandasFilters 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            prioridadeFilter={prioridadeFilter}
            setPrioridadeFilter={setPrioridadeFilter}
            onNew={() => handleOpenModal()}
          />

          {demandasLoading ? (
            <div className="flex justify-center items-center py-20">
              <span className="text-[10px] text-white/30 uppercase tracking-[0.4em] animate-pulse">Carregando demandas...</span>
            </div>
          ) : (
            <DemandasList 
              demandas={filteredDemandas}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>

      <DemandaModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        demandaToEdit={demandaToEdit}
        onSave={handleSave}
      />
    </div>
  );
}
