import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Instagram, ArrowLeft, TrendingUp, Users, 
  MessageSquare, Heart, Share2, Bookmark, 
  Calendar, DollarSign, CheckCircle2, Clock, 
  Plus, MoreVertical, Edit2, Trash2, 
  LayoutDashboard, FileText, BarChart3, 
  Settings, ChevronRight, Download, Filter,
  Link as LinkIcon, Camera, Eye, Info, Image as ImageIcon,
  LogOut, ArrowUpRight, BadgeDollarSign, ExternalLink,
  Wallet, Receipt, CreditCard, Send, Ban, Target, ArrowDownRight,
  AlertCircle, Lock, Unlock, PieChart as PieChartIcon
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { Switch } from "@/components/ui/switch";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Cell, PieChart, Pie 
} from 'recharts';
import { toast } from "sonner";
import { 
  getInstagramClient, 
  getFollowerHistory, 
  getInstagramPosts, 
  getInstagramPayments, 
  getInstagramTasks,
  addFollowerEntry,
  addInstagramPost,
  addInstagramPayment,
  addInstagramTask,
  updateFollowerEntry,
  updateInstagramPost,
  updateInstagramPayment,
  updateInstagramTask,
  deleteFollowerEntry,
  deleteInstagramPost,
  deleteInstagramPayment,
  deleteInstagramTask,
  getInstagramExpenses,
  addInstagramExpense,
  updateInstagramExpense,
  deleteInstagramExpense,
  updateInstagramClient,
  InstagramClient,
  FollowerHistory,
  InstagramPost,
  InstagramPayment,
  InstagramTask,
  InstagramExpense
} from "@/lib/instagram";
import { useAuth } from "@/hooks/useAuth";
import { uploadToImageKit } from "@/lib/imagekit";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

// Helper to format dates correctly without timezone shift (day before issue)
const formatLocalDate = (dateStr: string, formatStr: string) => {
  if (!dateStr) return "-";
  // Split YYYY-MM-DD or handle ISO strings
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return format(new Date(year, month, day), formatStr, { locale: ptBR });
  }
  return format(new Date(dateStr), formatStr, { locale: ptBR });
};

const AdminInstagramClient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Data States
  const [client, setClient] = useState<InstagramClient | null>(null);
  const [followers, setFollowers] = useState<FollowerHistory[]>([]);
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [payments, setPayments] = useState<InstagramPayment[]>([]);
  const [tasks, setTasks] = useState<InstagramTask[]>([]);
  const [expenses, setExpenses] = useState<InstagramExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States
  const [isFollowerModalOpen, setIsFollowerModalOpen] = useState(false);
  const [followerForm, setFollowerForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start: 0,
    end: 0,
    isAnalysis: false
  });

  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'reels' as any,
    caption: "",
    reach: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    saves: 0,
    link: ""
  });

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ description: "", amount: 0, date: new Date().toISOString().split('T')[0], category: 'produção' });
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: 'paid' as any
  });

  const [contractForm, setContractForm] = useState({
    contract_photos: [] as string[],
    contract_value: 0,
    contract_frequency: 'mensal' as 'único' | 'semanal' | 'quinzenal' | 'mensal',
    contract_payment_method: '',
    contract_payment_channels: '',
    contract_type: '',
    contract_installments: 1,
    contract_installment_value: 0,
    contract_due_start: new Date().toISOString().split('T')[0],
    contract_due_day: new Date().getDate(),
    contract_notes: ''
  });
  const [isContractUploading, setIsContractUploading] = useState(false);
  const [isContractLocked, setIsContractLocked] = useState(false);
  const [selectedContractPhoto, setSelectedContractPhoto] = useState<string | null>(null);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    priority: "média" as any,
    type: "task" as any,
    due_date: new Date().toISOString().split('T')[0]
  });

  // Editing IDs
  const [editingFollowerId, setEditingFollowerId] = useState<string | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  useEffect(() => {
    if (!client) return;
    setContractForm({
      contract_photos: client.contract_photos || [],
      contract_value: client.contract_value || 0,
      contract_frequency: client.contract_frequency || 'mensal',
      contract_payment_method: client.contract_payment_method || '',
      contract_payment_channels: client.contract_payment_channels || '',
      contract_type: client.contract_type || '',
      contract_installments: client.contract_installments || 1,
      contract_installment_value: client.contract_installment_value || 0,
      contract_due_start: client.contract_due_start || client.start_date || new Date().toISOString().split('T')[0],
      contract_due_day: client.contract_due_day || new Date().getDate(),
      contract_notes: client.contract_notes || ''
    });
    setIsContractLocked(!!client.contract_locked);
  }, [client]);

  const loadData = async (clientId: string) => {
    try {
      setLoading(true);
      
      // Load core client data first
      try {
        const clientData = await getInstagramClient(clientId);
        setClient(clientData);
      } catch (err) {
        console.error("Error loading client:", err);
        toast.error("Erro ao carregar perfil do cliente");
      }

      // Load other data independently to avoid complete failure if one table is missing
      const fetchModules = [
        { fn: () => getFollowerHistory(clientId), setter: setFollowers, name: "Seguidores", default: [] },
        { fn: () => getInstagramPosts(clientId), setter: setPosts, name: "Posts", default: [] },
        { fn: () => getInstagramPayments(clientId), setter: setPayments, name: "Pagamentos", default: [] },
        { fn: () => getInstagramTasks(clientId), setter: setTasks, name: "Tarefas", default: [] },
        { fn: () => getInstagramExpenses(clientId), setter: setExpenses, name: "Despesas", default: [] }
      ];

      await Promise.all(fetchModules.map(async (mod) => {
        try {
          const data = await mod.fn();
          mod.setter(data);
        } catch (err) {
          console.warn(`Error loading ${mod.name}:`, err);
          mod.setter(mod.default);
          // If it's a "table not found" error, we don't alert the user yet as it might be expected
        }
      }));

    } catch (error) {
      console.error("Critical error in loadData:", error);
    } finally {
      setLoading(false);
    }
  };

  const getComputedInstallmentValue = () => {
    if (contractForm.contract_installments && contractForm.contract_installments > 0) {
      return contractForm.contract_value && contractForm.contract_installments
        ? Number((contractForm.contract_value / contractForm.contract_installments).toFixed(2))
        : 0;
    }
    return 0;
  };

  const getContractSchedule = () => {
    if (!contractForm.contract_due_start) return [];
    const start = new Date(contractForm.contract_due_start);
    if (Number.isNaN(start.getTime())) return [];

    const installments = contractForm.contract_installments || 1;
    const dates = [] as { index: number; date: Date }[];

    for (let i = 0; i < installments; i++) {
      const due = new Date(start);
      if (contractForm.contract_frequency === 'semanal') {
        due.setDate(start.getDate() + (i * 7));
      } else if (contractForm.contract_frequency === 'quinzenal') {
        due.setDate(start.getDate() + (i * 14));
      } else if (contractForm.contract_frequency === 'mensal') {
        due.setMonth(start.getMonth() + i);
      }
      dates.push({ index: i + 1, date: due });
    }

    return dates;
  };

  const getNextPaymentDue = () => {
    const schedule = getContractSchedule();
    if (schedule.length === 0) return null;

    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const next = schedule.find((item) => item.date >= todayOnly);

    return next ?? schedule[schedule.length - 1];
  };

  const getNextPaymentCountdown = () => {
    const nextPayment = getNextPaymentDue();
    if (!nextPayment) return null;

    const today = new Date();
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const diffDays = Math.ceil((nextPayment.date.getTime() - todayOnly.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hoje";
    if (diffDays > 0) return `Em ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
    return `Venceu há ${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? "" : "s"}`;
  };

  const handleContractFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsContractUploading(true);

    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const uploaded = await uploadToImageKit(file, `contracts/${client?.id || 'unknown'}`);
        uploadedUrls.push(uploaded.url);
      }
      setContractForm((prev) => ({
        ...prev,
        contract_photos: [...(prev.contract_photos || []), ...uploadedUrls]
      }));
      toast.success(`${uploadedUrls.length} foto(s) adicionada(s) ao contrato.`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao enviar foto(s) do contrato.");
    } finally {
      setIsContractUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleRemoveContractPhoto = (photoUrl: string) => {
    setContractForm((prev) => ({
      ...prev,
      contract_photos: (prev.contract_photos || []).filter((photo) => photo !== photoUrl)
    }));
  };

  const handleToggleContractLock = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const updated = await updateInstagramClient(id, { contract_locked: !isContractLocked });
      setClient(updated);
      setIsContractLocked(!isContractLocked);
      toast.success(isContractLocked ? "Contrato destravado." : "Contrato travado.");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao alterar status do contrato.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContract = async () => {
    if (!id) return;
    if (isContractLocked) {
      toast.error("Contrato travado. Destrave para editar.");
      return;
    }
    try {
      setLoading(true);
      await updateInstagramClient(id, {
        contract_photos: contractForm.contract_photos || [],
        contract_value: Number(contractForm.contract_value || 0),
        contract_frequency: contractForm.contract_frequency,
        contract_payment_method: contractForm.contract_payment_method,
        contract_payment_channels: contractForm.contract_payment_channels,
        contract_type: contractForm.contract_type,
        contract_installments: Number(contractForm.contract_installments || 1),
        contract_installment_value: Number(contractForm.contract_installment_value || getComputedInstallmentValue()),
        contract_due_start: contractForm.contract_due_start,
        contract_due_day: Number(contractForm.contract_due_day || 0),
        contract_notes: contractForm.contract_notes
      });
      toast.success("Dados de contrato salvos.");
      loadData(id);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao salvar dados do contrato.");
    } finally {
      setLoading(false);
    }
  };

  // --- Calculations ---
  
  const followerStats = useMemo(() => {
    if (followers.length === 0) return null;
    const latest = followers[0];
    const previous = followers[1];
    
    const todayGrowth = latest ? latest.followers_end - latest.followers_start : 0;
    const totalGrowth = latest && followers[followers.length-1] 
      ? latest.followers_end - followers[followers.length-1].followers_start 
      : 0;

    // Weekly average
    const last7Days = followers.slice(0, 7);
    const weeklyAvg = last7Days.length > 0 
      ? last7Days.reduce((acc, curr) => acc + (curr.followers_end - curr.followers_start), 0) / last7Days.length 
      : 0;

    return {
      current: latest?.followers_end || 0,
      todayGrowth,
      weeklyAvg,
      totalGrowth,
      history: [...followers].reverse()
    };
  }, [followers]);

  const engagementStats = useMemo(() => {
    if (posts.length === 0) return { avg: 0, total: 0 };
    const totalEng = posts.reduce((acc, p) => acc + p.likes + p.comments + p.shares + p.saves, 0);
    const avg = totalEng / posts.length;
    return { avg, total: posts.length };
  }, [posts]);

  const financialStats = useMemo(() => {
    const totalPaid = payments.filter(p => p.status === 'paid').reduce((acc, p) => acc + Number(p.amount), 0);
    const pending = payments.filter(p => p.status === 'pending');
    return { totalPaid, pendingCount: pending.length };
  }, [payments]);

  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const handleAddExpense = async () => {
    try {
      await addInstagramExpense({
        client_id: id!,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        category: expenseForm.category
      });
      toast.success("Gasto registrado");
      setIsExpenseModalOpen(false);
      loadData(id!);
    } catch (e: any) { toast.error("Erro ao salvar gasto"); }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Excluir este gasto?")) return;
    try {
      await deleteInstagramExpense(expenseId);
      toast.success("Gasto excluído");
      loadData(id!);
    } catch (e: any) { toast.error("Erro ao excluir"); }
  };

  if (loading || !client) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-purple-500/30">
      
      {/* ── TOP BAR (Standardized) ── */}
      <header className="sticky top-0 z-50 border-b border-white/6 bg-[#0a0a0a]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1600px] px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/admin/instagram")}
              className="flex h-7 w-7 items-center justify-center rounded-sm border border-white/10 text-white/40 hover:text-white hover:border-white/25 transition-colors mr-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <img src={logoImg} alt="GoFocus" className="h-6 w-auto object-contain" />
            <span className="hidden sm:block text-white/15">|</span>
            <span className="hidden xs:block text-[8px] sm:text-[9px] uppercase tracking-[0.4em] text-white/30 font-medium whitespace-nowrap">
              Dashboard Individual
            </span>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden md:flex items-center gap-4 mr-4 pr-4 border-r border-white/10">
               <a 
                 href={`https://instagram.com/${client.username.replace('@', '')}`}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="flex flex-col items-end group"
               >
                  <p className="text-[10px] font-bold leading-none group-hover:text-purple-400 transition-colors">{client.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <p className="text-[8px] text-purple-400 uppercase tracking-widest leading-none">{client.username}</p>
                    <ExternalLink className="w-2.5 h-2.5 text-purple-400" />
                  </div>
               </a>
               <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5 relative">
                {client.profile_picture ? (
                  <img 
                    src={client.profile_picture} 
                    alt={client.name} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`fallback-icon w-full h-full flex items-center justify-center ${client.profile_picture ? 'hidden' : ''}`}>
                  <Camera className="w-4 h-4 text-white/20" />
                </div>
              </div>
            </div>
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

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="w-full lg:w-auto overflow-x-auto no-scrollbar pb-1">
              <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex flex-wrap gap-2 w-full">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-3 sm:px-6 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap">Geral</TabsTrigger>
                <TabsTrigger value="followers" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-3 sm:px-6 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap">Seguidores</TabsTrigger>
                <TabsTrigger value="posts" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-3 sm:px-6 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap">Posts</TabsTrigger>
                <TabsTrigger value="contract" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-3 sm:px-6 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap">Contrato</TabsTrigger>
                <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-3 sm:px-6 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap">Tarefas</TabsTrigger>
                <TabsTrigger value="finance" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-3 sm:px-6 py-2 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold transition-all whitespace-nowrap">Financeiro</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-white/60 hover:text-white gap-2 text-[10px] uppercase tracking-widest h-10 px-4">
                <Download className="w-3.5 h-3.5" /> Relatório
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-2 text-[10px] uppercase tracking-widest h-10 px-4 shadow-lg shadow-purple-600/20">
                    <Plus className="w-3.5 h-3.5" /> Ação Rápida
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white w-48">
                  <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => { setActiveTab('posts'); setIsPostModalOpen(true); }}>Novo Post</DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => { setActiveTab('followers'); setIsFollowerModalOpen(true); }}>Registrar Seguidores</DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => { setActiveTab('tasks'); setIsTaskModalOpen(true); }}>Nova Tarefa</DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => { setActiveTab('contract'); }}>Contrato</DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => { setActiveTab('finance'); setIsPaymentModalOpen(true); }}>Registrar Pagamento</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 1. VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white/[0.02] border-white/5 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardDescription className="text-[10px] uppercase tracking-widest font-black text-white/30">Seguidores</CardDescription>
                    <Users className="w-4 h-4 text-purple-400 opacity-50" />
                  </div>
                  <CardTitle className="text-2xl font-serif">{followerStats?.current.toLocaleString('pt-BR') || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-[10px] font-bold flex items-center gap-1 ${followerStats && followerStats.todayGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {followerStats && followerStats.todayGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {followerStats?.todayGrowth || 0} hoje
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardDescription className="text-[10px] uppercase tracking-widest font-black text-white/30">Engajamento</CardDescription>
                    <Heart className="w-4 h-4 text-blue-400 opacity-50" />
                  </div>
                  <CardTitle className="text-2xl font-serif">{engagementStats.avg.toFixed(1)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Base de {posts.length} posts</div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardDescription className="text-[10px] uppercase tracking-widest font-black text-white/30">Postagens</CardDescription>
                    <Camera className="w-4 h-4 text-amber-400 opacity-50" />
                  </div>
                  <CardTitle className="text-2xl font-serif">{posts.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Neste período</div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardDescription className="text-[10px] uppercase tracking-widest font-black text-white/30">Financeiro</CardDescription>
                    <DollarSign className="w-4 h-4 text-emerald-400 opacity-50" />
                  </div>
                  <CardTitle className="text-2xl font-serif">{financialStats.pendingCount > 0 ? 'Pendente' : 'Em dia'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-[10px] font-bold uppercase tracking-widest ${financialStats.pendingCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    Dia {client.payment_day}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Crescimento de Seguidores</CardTitle>
                  <CardDescription className="text-[10px] uppercase">Últimos lançamentos</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={followerStats?.history || []}>
                      <defs>
                        <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis 
                        dataKey="date" 
                        stroke="#ffffff20" 
                        fontSize={10} 
                        tickFormatter={(val) => formatLocalDate(val, 'dd/MM')} 
                      />
                      <YAxis stroke="#ffffff20" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                        itemStyle={{ color: '#a855f7' }}
                        labelFormatter={(label) => formatLocalDate(label, 'dd/MM/yyyy')}
                      />
                      <Area name="Seguidores" type="monotone" dataKey="followers_end" stroke="#a855f7" fillOpacity={1} fill="url(#colorFollow)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Distribuição de Conteúdo</CardTitle>
                  <CardDescription className="text-[10px] uppercase">Por tipo de postagem</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Reels', count: posts.filter(p => p.type === 'reels').length },
                      { name: 'Story', count: posts.filter(p => p.type === 'story').length },
                      { name: 'Feed', count: posts.filter(p => p.type === 'feed').length },
                      { name: 'Carrossel', count: posts.filter(p => p.type === 'carrossel').length },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff20" fontSize={10} />
                      <YAxis stroke="#ffffff20" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }} 
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar name="Total de Posts" dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 2. CONTROLE DE SEGUIDORES */}
          <TabsContent value="followers" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif">Lançamento de Seguidores</h3>
              <Dialog open={isFollowerModalOpen} onOpenChange={(open) => {
                setIsFollowerModalOpen(open);
                if (!open) setEditingFollowerId(null);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                    onClick={() => {
                      setEditingFollowerId(null);
                      setFollowerForm({
                        date: new Date().toISOString().split('T')[0],
                        start: 0,
                        end: 0,
                        isAnalysis: false
                      });
                    }}
                  >
                    <Plus className="w-4 h-4" /> Novo Registro
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Registrar Seguidores</DialogTitle>
                    <DialogDescription>Insira os dados de hoje ou de uma data específica.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Data</label>
                      <Input 
                        type="date" 
                        value={followerForm.date} 
                        onChange={(e) => setFollowerForm({...followerForm, date: e.target.value})}
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl mb-2">
                       <div className="space-y-0.5">
                          <label className="text-[10px] uppercase tracking-widest text-white/60 font-bold">Ainda em análise?</label>
                          <p className="text-[8px] text-white/30 uppercase font-bold">Marque se o dia ainda não acabou</p>
                       </div>
                       <Switch 
                          checked={followerForm.isAnalysis}
                          onCheckedChange={(checked) => setFollowerForm({...followerForm, isAnalysis: checked, end: checked ? 0 : followerForm.end})}
                       />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Início do Dia</label>
                        <Input 
                          type="number" 
                          value={followerForm.start || ""}
                          onChange={(e) => setFollowerForm({...followerForm, start: e.target.value === "" ? 0 : Number(e.target.value)})}
                          className="bg-white/5 border-white/10" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Fim do Dia</label>
                        <Input 
                          type="number" 
                          disabled={followerForm.isAnalysis}
                          placeholder={followerForm.isAnalysis ? "Em análise..." : "0"}
                          value={followerForm.isAnalysis ? "" : (followerForm.end || "")}
                          onChange={(e) => setFollowerForm({...followerForm, end: e.target.value === "" ? 0 : Number(e.target.value)})}
                          className={`bg-white/5 border-white/10 ${followerForm.isAnalysis ? 'opacity-50' : ''}`} 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsFollowerModalOpen(false)}>Cancelar</Button>
                    <Button className="bg-purple-600" onClick={async () => {
                      try {
                        const finalEnd = followerForm.isAnalysis ? 0 : followerForm.end;
                        if (editingFollowerId) {
                          await updateFollowerEntry(editingFollowerId, {
                            date: followerForm.date,
                            followers_start: followerForm.start,
                            followers_end: finalEnd
                          });
                          toast.success("Dados atualizados");
                        } else {
                          await addFollowerEntry({ 
                            client_id: id!, 
                            date: followerForm.date, 
                            followers_start: followerForm.start, 
                            followers_end: finalEnd 
                          });
                          toast.success("Dados salvos");
                        }
                        setIsFollowerModalOpen(false);
                        setEditingFollowerId(null);
                        loadData(id!);
                      } catch (e: any) { console.error(e); toast.error(e?.message || "Erro ao salvar"); }
                    }}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-[#0a0a0a] border-white/5">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                      <tr>
                        <th className="px-6 py-4">Data</th>
                        <th className="px-6 py-4">Início</th>
                        <th className="px-6 py-4">Fim</th>
                        <th className="px-6 py-4">Ganho/Perda</th>
                        <th className="px-6 py-4">% Crescimento</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {followers.map((f) => {
                        const isAnalysis = f.followers_end === 0;
                        const diff = f.followers_end - f.followers_start;
                        const pct = f.followers_start !== 0 ? ((diff / f.followers_start) * 100).toFixed(2) : "0";
                        return (
                          <tr key={f.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-6 py-4 text-white/60">{formatLocalDate(f.date, 'dd/MM/yyyy')}</td>
                            <td className="px-6 py-4 font-mono">{f.followers_start.toLocaleString()}</td>
                            <td className="px-6 py-4">
                              {isAnalysis ? (
                                <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] uppercase tracking-tighter">Em análise</Badge>
                              ) : (
                                <span className="font-mono">{f.followers_end.toLocaleString()}</span>
                              )}
                            </td>
                            <td className={`px-6 py-4 font-bold ${isAnalysis ? 'text-white/20' : (diff >= 0 ? 'text-emerald-400' : 'text-red-400')}`}>
                              {isAnalysis ? '--' : (diff > 0 ? `+${diff}` : diff)}
                            </td>
                            <td className="px-6 py-4 text-white/40">{isAnalysis ? '--' : `${pct}%`}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-white/20 hover:text-white"
                                  onClick={() => {
                                    setEditingFollowerId(f.id);
                                    setFollowerForm({
                                      date: f.date,
                                      start: f.followers_start,
                                      end: f.followers_end,
                                      isAnalysis: f.followers_end === 0
                                    });
                                    setIsFollowerModalOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 text-white/20 hover:text-red-400"
                                  onClick={async () => {
                                    if (confirm("Deseja excluir este registro?")) {
                                      await deleteFollowerEntry(f.id);
                                      loadData(id!);
                                    }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* 3. CONTROLE DE POSTS */}
          <TabsContent value="posts" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif">Relatório de Postagens</h3>
              <Dialog open={isPostModalOpen} onOpenChange={(open) => {
                setIsPostModalOpen(open);
                if (!open) setEditingPostId(null);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                    onClick={() => {
                      setEditingPostId(null);
                      setPostForm({
                        date: new Date().toISOString().split('T')[0],
                        type: 'reels',
                        caption: "",
                        reach: 0,
                        likes: 0,
                        comments: 0,
                        shares: 0,
                        saves: 0,
                        link: ""
                      });
                    }}
                  >
                    <Plus className="w-4 h-4" /> Registrar Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>{editingPostId ? 'Editar Post' : 'Registrar Publicação'}</DialogTitle>
                    <DialogDescription className="hidden">Preencha os dados do post</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Data</label>
                        <Input 
                          type="date" 
                          value={postForm.date}
                          onChange={(e) => setPostForm({...postForm, date: e.target.value})}
                          className="bg-white/5 border-white/10" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Tipo</label>
                        <Select value={postForm.type} onValueChange={(v) => setPostForm({...postForm, type: v})}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="feed">Feed</SelectItem>
                            <SelectItem value="reels">Reels</SelectItem>
                            <SelectItem value="story">Story</SelectItem>
                            <SelectItem value="carrossel">Carrossel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Legenda</label>
                      <Textarea 
                        value={postForm.caption}
                        onChange={(e) => setPostForm({...postForm, caption: e.target.value})}
                        placeholder="Escreva a legenda..." 
                        className="bg-white/5 border-white/10 h-20" 
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Alcance</label>
                        <Input type="number" value={postForm.reach} onChange={(e) => setPostForm({...postForm, reach: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Likes</label>
                        <Input type="number" value={postForm.likes} onChange={(e) => setPostForm({...postForm, likes: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Coment.</label>
                        <Input type="number" value={postForm.comments} onChange={(e) => setPostForm({...postForm, comments: Number(e.target.value)})} className="bg-white/5 border-white/10" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Link do Post (Opcional)</label>
                      <Input 
                        value={postForm.link}
                        onChange={(e) => setPostForm({...postForm, link: e.target.value})}
                        placeholder="https://..." 
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsPostModalOpen(false)}>Cancelar</Button>
                    <Button className="bg-purple-600" onClick={async () => {
                      const postData = {
                        client_id: id!,
                        date: postForm.date,
                        type: postForm.type,
                        caption: postForm.caption,
                        reach: postForm.reach,
                        likes: postForm.likes,
                        comments: postForm.comments,
                        shares: postForm.shares,
                        saves: postForm.saves,
                        post_link: postForm.link,
                      };
                      try {
                        if (editingPostId) {
                          await updateInstagramPost(editingPostId, postData);
                          toast.success("Post atualizado");
                        } else {
                          await addInstagramPost(postData);
                          toast.success("Post registrado");
                        }
                        setIsPostModalOpen(false);
                        setEditingPostId(null);
                        loadData(id!);
                      } catch (e: any) { console.error(e); toast.error(e?.message || "Erro ao salvar"); }
                    }}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {posts.map((post) => (
                <Card key={post.id} className="bg-[#0a0a0a] border-white/5 hover:border-purple-500/20 transition-all group">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <Badge className="bg-purple-500/10 text-purple-400 border-none text-[8px] uppercase tracking-widest">
                        {post.type}
                      </Badge>
                      <span className="text-[10px] text-white/30">{formatLocalDate(post.date, 'dd MMM')}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-xs text-white/60 line-clamp-2 italic">"{post.caption || 'Sem legenda'}"</p>
                    <div className="grid grid-cols-4 gap-2 py-2 border-y border-white/5">
                      <div className="text-center">
                        <p className="text-[8px] text-white/30 uppercase">Likes</p>
                        <p className="text-sm font-bold">{post.likes}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-white/30 uppercase">Coment</p>
                        <p className="text-sm font-bold">{post.comments}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-white/30 uppercase">Part.</p>
                        <p className="text-sm font-bold">{post.shares}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-white/30 uppercase">Salvos</p>
                        <p className="text-sm font-bold">{post.saves}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="justify-between border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-2 w-full">
                      <div className="flex items-center gap-1 text-emerald-400 text-[10px]">
                        <Eye className="w-3 h-3" /> {post.reach.toLocaleString()} alcance
                      </div>
                      <div className="flex gap-1 transition-opacity ml-auto">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-white/40 hover:text-white"
                          onClick={() => {
                            setEditingPostId(post.id);
                            setPostForm({
                              date: post.date,
                              type: post.type,
                              caption: post.caption,
                              reach: post.reach,
                              likes: post.likes,
                              comments: post.comments,
                              shares: post.shares,
                              saves: post.saves,
                              link: post.post_link
                            });
                            setIsPostModalOpen(true);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-white/40 hover:text-red-400"
                          onClick={async () => {
                            if (confirm("Deseja excluir este post?")) {
                              await deleteInstagramPost(post.id);
                              loadData(id!);
                            }
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                        {post.post_link && (
                          <a href={post.post_link} target="_blank" rel="noreferrer" className="text-white/20 hover:text-white transition-colors flex items-center justify-center w-6 h-6">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {posts.length === 0 && (
              <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem]">
                <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">Nenhuma publicação importada</p>
                <p className="text-xs text-white/10 mt-1">Sincronize com o Instagram no modal de integrações</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="contract" className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="text-lg font-serif">Gestão de Contrato</h3>
                <p className="text-sm text-white/40">Registre o valor combinado, cronograma de parcelas, formas de pagamento e fotos do contrato.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={isContractLocked ? "bg-red-500/15 text-red-300" : "bg-emerald-500/10 text-emerald-300"}>
                  {isContractLocked ? "Contrato travado" : "Contrato liberado"}
                </Badge>
                <Button
                  onClick={handleToggleContractLock}
                  title={isContractLocked ? "Destravar contrato" : "Travar contrato"}
                  variant="outline"
                  className="h-10 w-10 rounded-full p-0 text-white"
                >
                  {isContractLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </Button>
                <span className="text-[10px] text-white/50">{isContractLocked ? "Destrave para editar" : "Bloqueie para travar as alterações"}</span>
                <Button onClick={handleSaveContract} disabled={isContractLocked} className="bg-purple-600 hover:bg-purple-700 text-white gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  Salvar Contrato
                </Button>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
              <div className="space-y-4">
                <Card className="bg-white/[0.02] border-white/5 p-4 md:p-6">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase tracking-widest text-white/30 font-black">Resumo do Contrato</CardDescription>
                    <CardTitle className="text-2xl font-serif">{contractForm.contract_type || 'Sem tipo definido'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Valor combinado</p>
                        <p className="text-sm font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contractForm.contract_value || 0)}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Frequência</p>
                        <p className="text-sm font-bold capitalize">{contractForm.contract_frequency}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Forma</p>
                        <p className="text-sm font-bold">{contractForm.contract_payment_method || 'Não definido'}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Parcelas</p>
                        <p className="text-sm font-bold">{contractForm.contract_installments || 1} x {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contractForm.contract_installment_value || getComputedInstallmentValue())}</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/5 col-span-full">
                        <p className="text-[8px] uppercase tracking-widest text-white/30 mb-1">Próximo pagamento</p>
                        <p className="text-sm font-bold">{getNextPaymentCountdown() || 'Defina data e parcelas'}</p>
                        {getNextPaymentDue() && (
                          <p className="text-[10px] text-white/40">{formatLocalDate(getNextPaymentDue()!.date.toISOString(), 'dd MMM yyyy')}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Tipo de contrato</label>
                        <Input
                          disabled={isContractLocked}
                          value={contractForm.contract_type}
                          onChange={(e) => setContractForm({ ...contractForm, contract_type: e.target.value })}
                          placeholder="Ex: Tilápia / Semana"
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Valor combinado</label>
                        <Input
                          disabled={isContractLocked}
                          type="number"
                          value={contractForm.contract_value}
                          onChange={(e) => setContractForm({ ...contractForm, contract_value: Number(e.target.value) })}
                          placeholder="0.00"
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Frequência de pagamento</label>
                        <Select value={contractForm.contract_frequency} onValueChange={(v) => setContractForm({ ...contractForm, contract_frequency: v as any })}>
                          <SelectTrigger disabled={isContractLocked} className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="único">Único</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Método de pagamento</label>
                        <Select value={contractForm.contract_payment_method} onValueChange={(v) => setContractForm({ ...contractForm, contract_payment_method: v })}>
                          <SelectTrigger disabled={isContractLocked} className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Transferência">Transferência</SelectItem>
                            <SelectItem value="Boleto">Boleto</SelectItem>
                            <SelectItem value="Cartão">Cartão</SelectItem>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Canais de pagamento</label>
                        <Input
                          disabled={isContractLocked}
                          value={contractForm.contract_payment_channels}
                          onChange={(e) => setContractForm({ ...contractForm, contract_payment_channels: e.target.value })}
                          placeholder="PIX, Transferência, Cartão..."
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Número de parcelas</label>
                        <Input
                          disabled={isContractLocked}
                          type="number"
                          min={1}
                          value={contractForm.contract_installments}
                          onChange={(e) => setContractForm({ ...contractForm, contract_installments: Number(e.target.value) || 1 })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Valor da parcela</label>
                        <Input
                          disabled={isContractLocked}
                          type="number"
                          value={contractForm.contract_installment_value || getComputedInstallmentValue()}
                          onChange={(e) => setContractForm({ ...contractForm, contract_installment_value: Number(e.target.value) })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Data de início / vencimento</label>
                        <Input
                          disabled={isContractLocked}
                          type="date"
                          value={contractForm.contract_due_start}
                          onChange={(e) => setContractForm({ ...contractForm, contract_due_start: e.target.value })}
                          className="bg-white/5 border-white/10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Observações do contrato</label>
                      <Textarea
                        disabled={isContractLocked}
                        value={contractForm.contract_notes}
                        onChange={(e) => setContractForm({ ...contractForm, contract_notes: e.target.value })}
                        className="bg-white/5 border-white/10 h-28"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/[0.02] border-white/5 p-4 md:p-6">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase tracking-widest text-white/30 font-black">Parcelas previstas</CardDescription>
                    <CardTitle className="text-xl font-serif">Cronograma</CardTitle>
                    <p className="text-xs font-semibold text-emerald-300 mt-1 bg-emerald-500/10 rounded-xl px-2 py-1 inline-block">
                      {getNextPaymentCountdown() || 'Defina data e parcelas para ver o próximo vencimento'}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(getContractSchedule() || []).slice(0, 6).map((item) => (
                      <div key={item.index} className="flex items-center justify-between rounded-2xl bg-white/5 p-3 border border-white/5">
                        <span className="text-sm font-medium">Parcela {item.index}</span>
                        <span className="text-xs text-white/30">{formatLocalDate(item.date.toISOString(), 'dd MMM yyyy')}</span>
                      </div>
                    ))}
                    {getContractSchedule().length === 0 && (
                      <p className="text-xs text-white/40">Defina o valor e a data para ver as parcelas.</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="bg-white/[0.02] border-white/5 p-4 md:p-6">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-[10px] uppercase tracking-widest text-white/30 font-black">Fotos do Contrato</CardDescription>
                    <CardTitle className="text-xl font-serif">Imagens</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-[10px] uppercase tracking-widest text-white/40 mb-2 block">Enviar fotos</label>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isContractLocked}
                        onChange={handleContractFileUpload}
                        className="w-full text-[10px] text-white/80 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-purple-600 file:text-white/90 file:font-semibold bg-white/5 border border-white/10 rounded-xl disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      {isContractUploading && <p className="text-[10px] text-white/40 mt-2">Enviando fotos...</p>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {contractForm.contract_photos?.map((photo) => (
                        <div key={photo} className="relative rounded-3xl overflow-hidden border border-white/10 bg-white/5 shadow-sm">
                          <button
                            type="button"
                            onClick={() => setSelectedContractPhoto(photo)}
                            className="group block h-56 w-full overflow-hidden"
                          >
                            <img
                              src={photo}
                              alt="Contrato"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </button>
                          {!isContractLocked && (
                            <button
                              type="button"
                              onClick={() => handleRemoveContractPhoto(photo)}
                              className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center transition hover:bg-black/80"
                            >
                              &times;
                            </button>
                          )}
                        </div>
                      ))}
                      {(!contractForm.contract_photos || contractForm.contract_photos.length === 0) && (
                        <div className="col-span-full rounded-3xl border border-dashed border-white/10 bg-white/5 p-6 text-center text-white/30">
                          Nenhuma foto adicionada ainda.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Dialog open={Boolean(selectedContractPhoto)} onOpenChange={(open) => { if (!open) setSelectedContractPhoto(null); }}>
                  <DialogContent className="max-w-5xl w-full p-0 overflow-hidden rounded-3xl bg-[#0f1720] border border-white/10 shadow-2xl">
                    <div className="relative bg-black">
                      <button
                        type="button"
                        onClick={() => setSelectedContractPhoto(null)}
                        className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/70 text-white hover:bg-black/90 flex items-center justify-center"
                      >
                        ×
                      </button>
                      {selectedContractPhoto && (
                        <img
                          src={selectedContractPhoto}
                          alt="Contrato em tela grande"
                          className="h-[75vh] w-full object-contain bg-black"
                        />
                      )}
                    </div>
                    <DialogFooter className="justify-end p-4">
                      <Button onClick={() => setSelectedContractPhoto(null)} className="bg-white/10 text-white hover:bg-white/20">Fechar</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="finance" className="space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* ── ANALYSIS & CHART ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <Card className="lg:col-span-2 bg-white/[0.02] border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <div>
                    <h3 className="text-xs md:text-sm font-black text-white">Desempenho Financeiro</h3>
                    <p className="text-[8px] md:text-[10px] text-white/20 uppercase tracking-widest font-black mt-1">Faturamento mensal</p>
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-none px-2 py-0.5 md:px-3 md:py-1 text-[8px] md:text-[9px] uppercase font-black">
                    Alta
                  </Badge>
                </div>
                <div className="h-[180px] md:h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={payments.slice().reverse().map(p => ({
                      name: formatLocalDate(p.date, 'MMM/yy'),
                      amount: Number(p.amount)
                    }))}>
                      <defs>
                        <linearGradient id="colorAmountMobile" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#ffffff20', fontSize: 9}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#ffffff20', fontSize: 9}} tickFormatter={(v) => `R$${v}`} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAmountMobile)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-3 md:gap-4">
                 <Card className="bg-white/[0.02] border-white/5 rounded-2xl md:rounded-3xl p-4 md:p-6 relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform">
                       <PieChartIcon className="w-16 h-16 md:w-24 md:h-24" />
                    </div>
                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest font-black text-white/30 mb-1">Ticket Médio</p>
                    <h4 className="text-xl md:text-2xl font-serif">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(payments.length > 0 ? (financialStats.totalPaid / payments.length) : 0)}
                    </h4>
                    <p className="text-[8px] text-white/20 mt-1 uppercase font-black tracking-widest">Base de {payments.length} meses</p>
                 </Card>

                 <Card className="bg-emerald-500/5 border-emerald-500/10 rounded-2xl md:rounded-3xl p-4 md:p-6 flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                       <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div>
                       <p className="text-[8px] md:text-[9px] uppercase tracking-widest font-black text-emerald-400">Status Geral</p>
                       <p className="text-xs md:text-sm font-black text-white">Saúde Excelente</p>
                    </div>
                 </Card>
              </div>
            </div>

            {/* ── TOP STATS ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
                <CardHeader className="p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-1">
                    <CardDescription className="text-[7px] sm:text-[9px] uppercase tracking-widest text-white/30 font-black">Faturamento Total</CardDescription>
                    <Wallet className="w-3.5 h-3.5 text-emerald-500 opacity-50" />
                  </div>
                  <CardTitle className="text-lg sm:text-2xl font-serif">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.totalPaid)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                <CardHeader className="p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-1">
                    <CardDescription className="text-[7px] sm:text-[9px] uppercase tracking-widest text-white/30 font-black">Mensalidade</CardDescription>
                    <CreditCard className="w-3.5 h-3.5 text-purple-400 opacity-50" />
                  </div>
                  <CardTitle className="text-lg sm:text-2xl font-serif">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.monthly_value)}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
                <CardHeader className="p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-1">
                    <CardDescription className="text-[7px] sm:text-[9px] uppercase tracking-widest text-white/30 font-black">Pendência</CardDescription>
                    <Clock className="w-3.5 h-3.5 text-amber-500 opacity-50" />
                  </div>
                  <CardTitle className={`text-lg sm:text-2xl font-serif ${financialStats.pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {financialStats.pendingCount}
                  </CardTitle>
                </CardHeader>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 overflow-hidden group hover:bg-white/[0.04] transition-all relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                <CardHeader className="p-4 sm:p-5">
                  <div className="flex justify-between items-center mb-1">
                    <CardDescription className="text-[7px] sm:text-[9px] uppercase tracking-widest text-white/30 font-black">Target Anual</CardDescription>
                    <Target className="w-3.5 h-3.5 text-blue-400 opacity-50" />
                  </div>
                  <CardTitle className="text-lg sm:text-2xl font-serif text-white/90">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.monthly_value * 12)}
                  </CardTitle>
                </CardHeader>
              </Card>
            </div>

            {/* ── ACTION BAR ── */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 p-4 md:p-6 bg-white/[0.02] border border-white/5 rounded-2xl md:rounded-[2rem]">
              <div className="text-center md:text-left">
                <h3 className="text-base md:text-lg font-serif mb-1">Centro Administrativo</h3>
                <p className="text-[8px] md:text-[10px] uppercase tracking-widest text-white/20 font-bold tracking-tighter">Gestão de faturamento</p>
              </div>
              <div className="grid grid-cols-2 sm:flex items-center gap-2 md:gap-3 w-full md:w-auto">
                <Button 
                  variant="outline"
                  className="bg-white/5 border-white/10 h-10 md:h-11 rounded-xl text-[8px] md:text-[10px] uppercase font-bold tracking-widest"
                  onClick={() => {
                    const message = encodeURIComponent(`Olá ${client.name}! Lembrete de pagamento R$ ${client.monthly_value}.`);
                    window.open(`https://wa.me/55?text=${message}`, '_blank');
                  }}
                >
                  <Send className="w-3 h-3 mr-2" /> WhatsApp
                </Button>
                <Button 
                  variant="outline"
                  className="bg-white/5 border-white/10 h-10 md:h-11 rounded-xl text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-amber-500"
                  onClick={() => { setPaymentForm({ date: new Date().toISOString().split('T')[0], amount: client.monthly_value, status: 'pending' }); setIsPaymentModalOpen(true); }}
                >
                  <AlertCircle className="w-3 h-3 mr-2" /> Pendência
                </Button>
                <Button 
                  className="col-span-2 sm:col-auto bg-emerald-600 hover:bg-emerald-700 h-10 md:h-11 rounded-xl text-[8px] md:text-[10px] uppercase font-bold tracking-widest"
                  onClick={() => { setEditingPaymentId(null); setPaymentForm({ date: new Date().toISOString().split('T')[0], amount: client.monthly_value, status: 'paid' }); setIsPaymentModalOpen(true); }}
                >
                  Registrar Pagamento
                </Button>
              </div>
            </div>

            {/* ── HISTORY LIST ── */}
            <Card className="bg-white/[0.02] border-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden">
               {/* Desktop Table */}
               <div className="hidden md:block overflow-x-auto">
                 <table className="w-full text-left text-sm">
                   <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                     <tr>
                       <th className="px-6 py-4">Mês Referência</th>
                       <th className="px-6 py-4">Valor</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4 text-right">Ações</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5">
                     {payments.map((p) => (
                       <tr key={p.id} className="hover:bg-white/2 transition-colors group/row">
                         <td className="px-6 py-5">
                            <p className="text-sm font-bold text-white capitalize">{formatLocalDate(p.date, 'MMMM yyyy')}</p>
                         </td>
                         <td className="px-6 py-5">
                            <p className="text-sm font-black text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}</p>
                         </td>
                         <td className="px-6 py-5">
                            <Badge className={`text-[8px] uppercase tracking-widest border-none px-3 py-1 ${p.status === 'paid' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                              {p.status === 'paid' ? 'Liquidado' : 'Aguardando'}
                            </Badge>
                         </td>
                         <td className="px-6 py-5 text-right">
                           <div className="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white" onClick={() => { setEditingPaymentId(p.id); setPaymentForm({ date: p.date, amount: Number(p.amount), status: p.status }); setIsPaymentModalOpen(true); }}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-red-400" onClick={async () => { if (confirm("Excluir?")) { await deleteInstagramPayment(p.id); loadData(id!); } }}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>

               {/* Mobile List */}
               <div className="md:hidden divide-y divide-white/5">
                 {payments.map((p) => (
                   <div key={p.id} className="p-4 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          <Receipt className="w-5 h-5" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-white capitalize">{formatLocalDate(p.date, 'MMM/yy')}</p>
                          <p className="text-xs font-black text-white/60">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-white/5" onClick={() => { setEditingPaymentId(p.id); setPaymentForm({ date: p.date, amount: Number(p.amount), status: p.status }); setIsPaymentModalOpen(true); }}>
                           <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-red-500/10 text-red-400" onClick={async () => { if (confirm("Excluir?")) { await deleteInstagramPayment(p.id); loadData(id!); } }}>
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                   </div>
                 ))}
               </div>
            </Card>

            {/* ── COSTS & NET PROFIT ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card className="bg-[#0c0c0c] border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8">
                     <div>
                        <h3 className="text-lg md:text-xl font-serif text-white">Controle de Custos</h3>
                        <p className="text-[9px] uppercase tracking-widest text-white/20 font-black mt-1">Despesas Operacionais</p>
                     </div>
                     <Button variant="outline" className="h-9 rounded-xl text-[9px] uppercase font-bold tracking-widest bg-white/5 border-white/10 px-4" onClick={() => setIsExpenseModalOpen(true)}>
                        <Plus className="w-3 h-3 mr-2" /> Novo Gasto
                     </Button>
                  </div>
                  <div className="space-y-3">
                     {expenses.length === 0 ? (
                        <div className="py-12 text-center bg-white/[0.01] border border-dashed border-white/5 rounded-3xl">
                           <p className="text-[8px] uppercase tracking-widest text-white/20">Sem despesas registradas</p>
                        </div>
                     ) : (
                        expenses.map(exp => (
                           <div key={exp.id} className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5 group">
                              <div className="flex items-center gap-4">
                                 <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400"><ArrowDownRight className="w-4 h-4" /></div>
                                 <div>
                                    <p className="text-sm font-bold text-white">{exp.description}</p>
                                    <p className="text-[9px] text-white/30 uppercase font-black">{formatLocalDate(exp.date, 'dd MMM yyyy')}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <p className="text-sm font-black text-red-400">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.amount)}</p>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}>
                                    <Trash2 className="w-3.5 h-3.5 text-white/20" />
                                 </Button>
                              </div>
                           </div>
                        ))
                     )}
                  </div>
               </Card>

               <Card className="bg-[#0c0c0c] border-white/5 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full" />
                  <div className="relative z-10 flex flex-col h-full items-center justify-center">
                     <div className="mb-6 text-center">
                        <h3 className="text-lg md:text-xl font-serif text-white">Rentabilidade Real</h3>
                        <p className="text-[9px] uppercase tracking-widest text-white/20 font-black mt-1">Margem Líquida Estimada</p>
                     </div>
                     <div className="w-full h-48 md:h-56">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie data={[
                                 { name: 'Lucro', value: Math.max(0, financialStats.totalPaid - expenses.reduce((acc, e) => acc + e.amount, 0)), color: '#10b981' },
                                 { name: 'Custo', value: expenses.reduce((acc, e) => acc + e.amount, 0), color: '#ef4444' }
                              ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                 <Cell fill="#10b981" />
                                 <Cell fill="#ef4444" stroke="none" />
                              </Pie>
                              <Tooltip contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                     <div className="w-full mt-6 space-y-4">
                        <div className="p-4 bg-white/2 rounded-2xl border border-white/5 text-center">
                           <p className="text-[8px] uppercase tracking-widest text-white/20 font-black mb-1">Lucro Líquido</p>
                           <p className="text-2xl font-black text-emerald-400">
                             {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.totalPaid - expenses.reduce((acc, e) => acc + e.amount, 0))}
                           </p>
                        </div>
                     </div>
                   </div>
                </Card>
             </div>
           </TabsContent>

          {/* 5. TAREFAS */}
          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif">Planner Interno</h3>
              <Dialog open={isTaskModalOpen} onOpenChange={(open) => {
                setIsTaskModalOpen(open);
                if (!open) setEditingTaskId(null);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-purple-600 hover:bg-purple-700 gap-2"
                    onClick={() => {
                      setEditingTaskId(null);
                      setTaskForm({
                        title: "",
                        priority: "média",
                        type: "task",
                        due_date: new Date().toISOString().split('T')[0]
                      });
                    }}
                  >
                    <Plus className="w-4 h-4" /> Nova Tarefa
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Adicionar Tarefa / Ideia</DialogTitle>
                    <DialogDescription className="hidden">Adicione uma nova tarefa ou ideia ao planner</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Título</label>
                      <Input 
                        value={taskForm.title}
                        onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                        placeholder="Ex: Pesquisa de referências" 
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Prioridade</label>
                        <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({...taskForm, priority: v})}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Prioridade" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="baixa">Baixa</SelectItem>
                            <SelectItem value="média">Média</SelectItem>
                            <SelectItem value="alta">Alta</SelectItem>
                            <SelectItem value="urgente">Urgente</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Tipo</label>
                        <Select value={taskForm.type} onValueChange={(v) => setTaskForm({...taskForm, type: v})}>
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="task">Tarefa</SelectItem>
                            <SelectItem value="idea">Ideia</SelectItem>
                            <SelectItem value="pauta">Pauta</SelectItem>
                            <SelectItem value="checklist">Checklist</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Prazo</label>
                      <Input 
                        type="date" 
                        value={taskForm.due_date}
                        onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
                    <Button className="bg-purple-600" onClick={async () => {
                      try {
                        const taskData = {
                          client_id: id!,
                          title: taskForm.title,
                          priority: taskForm.priority,
                          type: taskForm.type,
                          due_date: taskForm.due_date,
                          completed: false
                        };
                        if (editingTaskId) {
                          await updateInstagramTask(editingTaskId, taskData);
                          toast.success("Tarefa atualizada");
                        } else {
                          await addInstagramTask(taskData);
                          toast.success("Tarefa adicionada");
                        }
                        setIsTaskModalOpen(false);
                        setEditingTaskId(null);
                        loadData(id!);
                        setTaskForm({ ...taskForm, title: "" });
                      } catch (e: any) { console.error(e); toast.error(e?.message || "Erro ao salvar"); }
                    }}>Adicionar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task) => (
                <Card key={task.id} className={`
                  bg-[#0a0a0a] border-white/5 hover:border-white/10 transition-all
                  ${task.completed ? 'opacity-50' : ''}
                `}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={async () => {
                            await updateInstagramTask(task.id, { completed: !task.completed });
                            loadData(id!);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${task.completed ? 'bg-purple-500 border-purple-500' : 'border-white/20 hover:border-purple-500'}`}
                        >
                          {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </button>
                        <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-white/10 bg-white/5 text-white/40">
                          {task.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`
                          text-[8px] border-none
                          ${task.priority === 'urgente' ? 'bg-red-500 text-white' : 
                            task.priority === 'alta' ? 'bg-orange-500 text-white' : 
                            task.priority === 'média' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60'}
                        `}>
                          {task.priority.toUpperCase()}
                        </Badge>
                        <div className="flex gap-1 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-white/20 hover:text-white"
                            onClick={() => {
                              setEditingTaskId(task.id);
                              setTaskForm({
                                title: task.title,
                                priority: task.priority,
                                type: task.type,
                                due_date: task.due_date
                              });
                              setIsTaskModalOpen(true);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-white/20 hover:text-red-400"
                            onClick={async () => {
                              if (confirm("Deseja excluir esta tarefa?")) {
                                await deleteInstagramTask(task.id);
                                loadData(id!);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div 
                      className="cursor-pointer hover:opacity-70 transition-all"
                      onClick={() => {
                        setEditingTaskId(task.id);
                        setTaskForm({
                          title: task.title,
                          priority: task.priority,
                          type: task.type,
                          due_date: task.due_date
                        });
                        setIsTaskModalOpen(true);
                      }}
                    >
                      <CardTitle className={`text-sm font-medium mt-3 ${task.completed ? 'line-through text-white/20' : ''}`}>
                        {task.title}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-[10px] text-white/30 mt-2">
                        <Calendar className="w-3 h-3" />
                        {task.due_date ? formatLocalDate(task.due_date, 'dd MMM') : 'Sem prazo'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent />
                </Card>
              ))}
            </div>
          </TabsContent>

        </Tabs>
      </main>

      {/* --- FINANCE MODALS --- */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{editingPaymentId ? 'Editar Pagamento' : 'Registrar Novo Pagamento'}</DialogTitle>
            <DialogDescription>Gerencie as entradas financeiras deste cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Data</label>
                <Input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Valor</label>
                <Input type="number" value={paymentForm.amount || ""} onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Status</label>
              <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({...paymentForm, status: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="paid">Confirmado / Liquidado</SelectItem>
                  <SelectItem value="pending">Aguardando Pagamento</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
            <Button className="bg-emerald-600" onClick={async () => {
              try {
                if (editingPaymentId) {
                  await updateInstagramPayment(editingPaymentId, paymentForm);
                  toast.success("Pagamento atualizado");
                } else {
                  await addInstagramPayment({ client_id: id!, ...paymentForm });
                  toast.success("Pagamento registrado");
                }
                setIsPaymentModalOpen(false);
                loadData(id!);
              } catch (e: any) { toast.error("Erro ao salvar"); }
            }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
        <DialogContent className="bg-[#0f0f0f] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Registrar Novo Gasto</DialogTitle>
            <DialogDescription>Custos operacionais (tráfego, design, ferramentas).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Descrição</label>
              <Input value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="Ex: Campanha de Tráfego" className="bg-white/5 border-white/10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Valor</label>
                <Input type="number" value={expenseForm.amount || ""} onChange={(e) => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} className="bg-white/5 border-white/10" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-white/40">Data</label>
                <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="bg-white/5 border-white/10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40">Categoria</label>
              <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({...expenseForm, category: v})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                  <SelectItem value="produção">Produção</SelectItem>
                  <SelectItem value="tráfego">Tráfego Pago</SelectItem>
                  <SelectItem value="ferramentas">Ferramentas / SaaS</SelectItem>
                  <SelectItem value="extra">Extras / Bônus</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
            <Button className="bg-red-600" onClick={handleAddExpense}>Confirmar Gasto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap');
        .font-serif { font-family: 'Bodoni Moda', serif; }
      `}} />
    </div>
  );
};

export default AdminInstagramClient;

