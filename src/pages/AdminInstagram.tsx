import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Instagram, Plus, Users, DollarSign, TrendingUp, 
  Search, MoreVertical, Edit2, LayoutDashboard,
  Calendar, CheckCircle2, AlertCircle, Clock,
  Filter, ArrowRight, LayoutGrid, List,
  TrendingDown, Briefcase, MessageSquare,
  ShieldAlert, BadgeDollarSign, UserPlus,
  ExternalLink, Trash2, Camera, LogOut, ArrowUpRight,
  Layers, Tag
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  getInstagramClients, 
  createInstagramClient, 
  updateInstagramClient,
  deleteInstagramClient,
  InstagramClient 
} from "@/lib/instagram";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminInstagram = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<InstagramClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form State
  const [newClient, setNewClient] = useState({
    name: "",
    username: "",
    profile_picture: "",
    niche: "",
    monthly_value: 0,
    payment_day: 1,
    status: "ativo" as any,
    notes: ""
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await getInstagramClients();
      setClients(data);
    } catch (error) {
      toast.error("Erro ao carregar clientes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClient = async () => {
    if (!newClient.name || !newClient.username) {
      toast.error("Nome e @ são obrigatórios");
      return;
    }

    try {
      await createInstagramClient({
        ...newClient,
        start_date: new Date().toISOString().split('T')[0]
      });
      toast.success("Cliente adicionado com sucesso!");
      setIsAddDialogOpen(false);
      loadClients();
      setNewClient({
        name: "",
        username: "",
        profile_picture: "",
        niche: "",
        monthly_value: 0,
        payment_day: 1,
        status: "ativo",
        notes: ""
      });
    } catch (error) {
      toast.error("Erro ao adicionar cliente");
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    try {
      await deleteInstagramClient(id);
      toast.success("Cliente excluído");
      loadClients();
    } catch (error) {
      toast.error("Erro ao excluir cliente");
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.niche?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery]);

  const stats = useMemo(() => {
    const active = clients.filter(c => c.status === 'ativo').length;
    const totalMonthly = clients.reduce((acc, c) => acc + (Number(c.monthly_value) || 0), 0);
    const pendingPayments = clients.filter(c => c.status === 'pendente').length;
    
    return {
      total: clients.length,
      active,
      revenue: totalMonthly,
      pending: pendingPayments
    };
  }, [clients]);

  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-primary/30">
      
      {/* ── TOP BAR (Matching Dashboard) ── */}
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
              className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 rounded-sm text-[8px] sm:text-[9px] uppercase tracking-widest text-white/50 hover:text-white transition-colors"
            >
              <span className="hidden xs:inline">Ver Site</span>
              <ArrowUpRight className="h-3 w-3" />
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-[8px] sm:text-[9px] uppercase tracking-widest text-white/35 hover:text-white transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span className="hidden xs:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 sm:py-12">

        {/* ── PAGE TITLE + TABS (Matching Dashboard) ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10 pb-8 border-b border-white/6">
          <div>
            <p className="text-[9px] uppercase tracking-[0.45em] text-white/30 mb-2 font-medium">Administração</p>
            <h1 className="text-2xl sm:text-3xl font-serif font-normal text-white">Gestão Social Media</h1>
          </div>

          {/* Tab switcher */}
          <div className="flex items-center border border-white/10 rounded-sm overflow-hidden self-start w-full sm:w-auto">
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all text-white/40 hover:text-white/70"
            >
              <LayoutGrid className="h-3 w-3" />
              Projetos
            </button>
            <button
              onClick={() => navigate("/admin/dashboard?tab=categories")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 text-white/40 hover:text-white/70"
            >
              <Layers className="h-3 w-3" />
              Categorias
            </button>
            <button
              onClick={() => navigate("/admin/planner")}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 text-white/40 hover:text-white/70"
            >
              <Calendar className="h-3 w-3" />
              Planner
            </button>
            <button
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-3 text-[9px] font-bold uppercase tracking-widest transition-all border-l border-white/10 bg-white text-black shadow-lg"
            >
              <Instagram className="h-3 w-3" />
              Instagram
            </button>
          </div>
        </div>

        {/* Header Content */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-xl font-serif text-white/90">Gerenciamento Instagram</h2>
            <p className="text-white/30 text-[11px] uppercase tracking-widest mt-1">Controle de clientes e métricas</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <Input 
                placeholder="Buscar cliente..." 
                className="pl-10 bg-white/5 border-white/10 w-[200px] md:w-[300px] focus:border-purple-500/50 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 text-white gap-2 shadow-lg shadow-purple-600/20">
                  <Plus className="w-4 h-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#0f0f0f] border-white/10 text-white sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">Adicionar Novo Cliente</DialogTitle>
                  <DialogDescription className="text-white/40">
                    Preencha os dados básicos para iniciar a gestão do Instagram.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Nome do Cliente</label>
                      <Input 
                        placeholder="Ex: João Silva" 
                        value={newClient.name}
                        onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">@ do Instagram</label>
                      <Input 
                        placeholder="Ex: @joaosilva" 
                        value={newClient.username}
                        onChange={(e) => setNewClient({...newClient, username: e.target.value})}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Nicho</label>
                      <Input 
                        placeholder="Ex: Moda, Gastronomia" 
                        value={newClient.niche}
                        onChange={(e) => setNewClient({...newClient, niche: e.target.value})}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Valor Mensal (R$)</label>
                      <Input 
                        type="number"
                        placeholder="0.00" 
                        value={newClient.monthly_value}
                        onChange={(e) => setNewClient({...newClient, monthly_value: Number(e.target.value)})}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Dia de Pagamento</label>
                      <Input 
                        type="number"
                        min="1"
                        max="31"
                        placeholder="10" 
                        value={newClient.payment_day}
                        onChange={(e) => setNewClient({...newClient, payment_day: Number(e.target.value)})}
                        className="bg-white/5 border-white/10"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Status Inicial</label>
                      <Select 
                        value={newClient.status} 
                        onValueChange={(v) => setNewClient({...newClient, status: v})}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pausado">Pausado</SelectItem>
                          <SelectItem value="cancelado">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-widest text-white/40">Observações</label>
                    <Input 
                      placeholder="Alguma nota importante..." 
                      value={newClient.notes}
                      onChange={(e) => setNewClient({...newClient, notes: e.target.value})}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsAddDialogOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddClient} className="bg-purple-600 hover:bg-purple-700">Criar Cliente</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Stats Grid with Colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <Card className="bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Total de Clientes</CardDescription>
              <CardTitle className="text-3xl font-serif flex items-end gap-3 text-purple-400">
                {stats.total}
                <Users className="w-5 h-5 mb-1 opacity-50" />
              </CardTitle>
            </CardHeader>
            <div className="h-1 w-full bg-purple-500/20" />
          </Card>

          <Card className="bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Faturamento Mensal</CardDescription>
              <CardTitle className="text-3xl font-serif flex items-end gap-3 text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.revenue)}
                <TrendingUp className="w-5 h-5 mb-1 opacity-50" />
              </CardTitle>
            </CardHeader>
            <div className="h-1 w-full bg-emerald-500/20" />
          </Card>

          <Card className="bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Clientes Ativos</CardDescription>
              <CardTitle className="text-3xl font-serif flex items-end gap-3 text-blue-400">
                {stats.active}
                <CheckCircle2 className="w-5 h-5 mb-1 opacity-50" />
              </CardTitle>
            </CardHeader>
            <div className="h-1 w-full bg-blue-500/20" />
          </Card>

          <Card className="bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all">
            <CardHeader className="pb-2">
              <CardDescription className="text-[9px] uppercase tracking-[0.2em] text-white/30 font-bold">Pendências</CardDescription>
              <CardTitle className="text-3xl font-serif flex items-end gap-3 text-amber-400">
                {stats.pending}
                <Clock className="w-5 h-5 mb-1 opacity-50" />
              </CardTitle>
            </CardHeader>
            <div className="h-1 w-full bg-amber-500/20" />
          </Card>
        </div>

        {/* Clients Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <Instagram className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <h3 className="text-xl font-serif mb-2">Nenhum cliente encontrado</h3>
            <p className="text-white/40">Comece adicionando seu primeiro cliente de social media.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredClients.map((client) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="bg-[#0a0a0a] border-white/5 hover:border-purple-500/30 transition-all overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-white/10 to-white/5 p-0.5 border border-white/10 overflow-hidden">
                          {client.profile_picture ? (
                            <img src={client.profile_picture} alt={client.name} className="w-full h-full object-cover rounded-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5 text-white/20">
                              <Camera className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-serif text-lg leading-tight">{client.name}</h3>
                          <p className="text-purple-400 text-sm">{client.username}</p>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white/20 hover:text-white">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a1a] border-white/10 text-white">
                          <DropdownMenuItem className="gap-2 focus:bg-white/10 cursor-pointer">
                            <Edit2 className="w-3.5 h-3.5" /> Editar Cliente
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="gap-2 text-red-400 focus:bg-red-400/10 cursor-pointer"
                            onClick={() => handleDeleteClient(client.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Status</p>
                        <Badge variant="outline" className={`
                          text-[10px] border-none px-0 h-auto
                          ${client.status === 'ativo' ? 'text-emerald-400' : 
                            client.status === 'pendente' ? 'text-amber-400' : 
                            client.status === 'pausado' ? 'text-blue-400' : 'text-red-400'}
                        `}>
                          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
                            client.status === 'ativo' ? 'bg-emerald-400' : 
                            client.status === 'pendente' ? 'bg-amber-400' : 
                            client.status === 'pausado' ? 'bg-blue-400' : 'bg-red-400'
                          }`} />
                          {client.status.charAt(0).toUpperCase() + client.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Nicho</p>
                        <p className="text-xs font-medium truncate">{client.niche || 'Não definido'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Pagamento</p>
                        <p className="text-xs font-medium">Todo dia {client.payment_day}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Valor</p>
                        <p className="text-xs font-bold text-emerald-400">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.monthly_value)}
                        </p>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2">
                    <Button 
                      className="w-full bg-white/5 hover:bg-purple-600 hover:text-white border-white/5 transition-all gap-2"
                      onClick={() => navigate(`/admin/instagram/cliente/${client.id}`)}
                    >
                      Abrir Dashboard Individual
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Style overrides for premium look */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap');
        .font-serif { font-family: 'Bodoni Moda', serif; }
      `}} />
    </div>
  );
};

export default AdminInstagram;
