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
  Link as LinkIcon, Camera, Eye, Info,
  LogOut, ArrowUpRight, BadgeDollarSign, ExternalLink
} from "lucide-react";
import logoImg from "@/assets/logo.png";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  updateInstagramTask,
  InstagramClient,
  FollowerHistory,
  InstagramPost,
  InstagramPayment,
  InstagramTask
} from "@/lib/instagram";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

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
  const [loading, setLoading] = useState(true);

  // Form States
  const [isFollowerModalOpen, setIsFollowerModalOpen] = useState(false);
  const [followerForm, setFollowerForm] = useState({
    date: new Date().toISOString().split('T')[0],
    start: 0,
    end: 0
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
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    status: 'paid' as any
  });

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

  const loadData = async (clientId: string) => {
    try {
      setLoading(true);
      const [clientData, followerData, postData, paymentData, taskData] = await Promise.all([
        getInstagramClient(clientId),
        getFollowerHistory(clientId),
        getInstagramPosts(clientId),
        getInstagramPayments(clientId),
        getInstagramTasks(clientId)
      ]);
      setClient(clientData);
      setFollowers(followerData);
      setPosts(postData);
      setPayments(paymentData);
      setTasks(taskData);
    } catch (error) {
      toast.error("Erro ao carregar dados do cliente");
      console.error(error);
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
        <div className="mx-auto max-w-7xl px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
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
            <div className="hidden md:flex items-center gap-3 mr-4 pr-4 border-r border-white/10">
               <div className="text-right">
                  <p className="text-[10px] font-bold leading-none">{client.name}</p>
                  <p className="text-[8px] text-purple-400 uppercase tracking-widest mt-1">{client.username}</p>
               </div>
               <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5">
                {client.profile_picture ? (
                  <img src={client.profile_picture} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-4 h-4 m-2 text-white/20" />
                )}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <TabsList className="bg-white/5 border border-white/10 p-1 h-auto flex flex-wrap gap-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-4 sm:px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all">Visão Geral</TabsTrigger>
              <TabsTrigger value="followers" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-4 sm:px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all">Seguidores</TabsTrigger>
              <TabsTrigger value="posts" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-4 sm:px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all">Posts</TabsTrigger>
              <TabsTrigger value="finance" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-4 sm:px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all">Financeiro</TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-black text-white/40 px-4 sm:px-6 py-2 text-[10px] uppercase tracking-widest font-bold transition-all border-none">Tarefas</TabsTrigger>
            </TabsList>

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
                  <DropdownMenuItem className="focus:bg-white/10 cursor-pointer" onClick={() => { setActiveTab('finance'); setIsPaymentModalOpen(true); }}>Registrar Pagamento</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 1. VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Seguidores</CardDescription>
                  <CardTitle className="text-2xl font-serif">{followerStats?.current.toLocaleString('pt-BR') || 0}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-[10px] flex items-center gap-1 ${followerStats && followerStats.todayGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {followerStats && followerStats.todayGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {followerStats?.todayGrowth || 0} hoje
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Engajamento Médio</CardDescription>
                  <CardTitle className="text-2xl font-serif">{engagementStats.avg.toFixed(1)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[10px] text-white/30">Baseado em {posts.length} posts</div>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Total de Posts</CardDescription>
                  <CardTitle className="text-2xl font-serif">{posts.length}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[10px] text-white/30">Neste período</div>
                </CardContent>
              </Card>

              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase tracking-widest text-white/30">Status de Pagamento</CardDescription>
                  <CardTitle className="text-2xl font-serif">{financialStats.pendingCount > 0 ? 'Pendente' : 'Em dia'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-[10px] ${financialStats.pendingCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
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
                        tickFormatter={(val) => format(new Date(val), 'dd/MM')} 
                      />
                      <YAxis stroke="#ffffff20" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                        itemStyle={{ color: '#a855f7' }}
                      />
                      <Area type="monotone" dataKey="followers_end" stroke="#a855f7" fillOpacity={1} fill="url(#colorFollow)" strokeWidth={2} />
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
                      <Tooltip contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }} />
                      <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
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
                        end: 0
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
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Início do Dia</label>
                        <Input 
                          type="number" 
                          value={followerForm.start}
                          onChange={(e) => setFollowerForm({...followerForm, start: Number(e.target.value)})}
                          className="bg-white/5 border-white/10" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Fim do Dia</label>
                        <Input 
                          type="number" 
                          value={followerForm.end}
                          onChange={(e) => setFollowerForm({...followerForm, end: Number(e.target.value)})}
                          className="bg-white/5 border-white/10" 
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsFollowerModalOpen(false)}>Cancelar</Button>
                    <Button className="bg-purple-600" onClick={async () => {
                      try {
                        if (editingFollowerId) {
                          await updateFollowerEntry(editingFollowerId, {
                            date: followerForm.date,
                            followers_start: followerForm.start,
                            followers_end: followerForm.end
                          });
                          toast.success("Dados atualizados");
                        } else {
                          await addFollowerEntry({ 
                            client_id: id!, 
                            date: followerForm.date, 
                            followers_start: followerForm.start, 
                            followers_end: followerForm.end 
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
                        const diff = f.followers_end - f.followers_start;
                        const pct = f.followers_start !== 0 ? ((diff / f.followers_start) * 100).toFixed(2) : "0";
                        return (
                          <tr key={f.id} className="hover:bg-white/2 transition-colors">
                            <td className="px-6 py-4 text-white/60">{format(new Date(f.date), 'dd/MM/yyyy')}</td>
                            <td className="px-6 py-4">{f.followers_start.toLocaleString()}</td>
                            <td className="px-6 py-4 font-medium">{f.followers_end.toLocaleString()}</td>
                            <td className={`px-6 py-4 font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                            <td className="px-6 py-4 text-white/40">{pct}%</td>
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
                                      end: f.followers_end
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
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-white sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Novo Registro de Post</DialogTitle>
                    <DialogDescription className="hidden">Registre um novo post no histórico</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                            <SelectItem value="reels">Reels</SelectItem>
                            <SelectItem value="story">Story</SelectItem>
                            <SelectItem value="feed">Feed</SelectItem>
                            <SelectItem value="carrossel">Carrossel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Legenda</label>
                      <Input 
                        value={postForm.caption}
                        onChange={(e) => setPostForm({...postForm, caption: e.target.value})}
                        placeholder="Snippet da legenda..." 
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-white/40">Alcance</label>
                        <Input 
                          type="number" 
                          value={postForm.reach}
                          onChange={(e) => setPostForm({...postForm, reach: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 h-8 text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-white/40">Likes</label>
                        <Input 
                          type="number" 
                          value={postForm.likes}
                          onChange={(e) => setPostForm({...postForm, likes: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 h-8 text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-white/40">Coment.</label>
                        <Input 
                          type="number" 
                          value={postForm.comments}
                          onChange={(e) => setPostForm({...postForm, comments: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 h-8 text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-white/40">Comp.</label>
                        <Input 
                          type="number" 
                          value={postForm.shares}
                          onChange={(e) => setPostForm({...postForm, shares: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 h-8 text-xs" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8px] uppercase text-white/40">Salvos</label>
                        <Input 
                          type="number" 
                          value={postForm.saves}
                          onChange={(e) => setPostForm({...postForm, saves: Number(e.target.value)})}
                          className="bg-white/5 border-white/10 h-8 text-xs" 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Link do Post</label>
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
                      <span className="text-[10px] text-white/30">{format(new Date(post.date), 'dd MMM', { locale: ptBR })}</span>
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
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
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
          </TabsContent>

          {/* 4. FINANCEIRO */}
          <TabsContent value="finance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase tracking-widest">Lucro Total Acumulado</CardDescription>
                  <CardTitle className="text-2xl font-serif text-emerald-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(financialStats.totalPaid)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase tracking-widest">Valor Mensal</CardDescription>
                  <CardTitle className="text-2xl font-serif">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(client.monthly_value)}
                  </CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-[#0a0a0a] border-white/5">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase tracking-widest">Pendências</CardDescription>
                  <CardTitle className="text-2xl font-serif text-amber-400">{financialStats.pendingCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-serif">Histórico de Pagamentos</h3>
              <Dialog open={isPaymentModalOpen} onOpenChange={(open) => {
                setIsPaymentModalOpen(open);
                if (!open) setEditingPaymentId(null);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                    onClick={() => {
                      setEditingPaymentId(null);
                      setPaymentForm({
                        date: new Date().toISOString().split('T')[0],
                        amount: 0,
                        status: 'paid'
                      });
                    }}
                  >
                    <BadgeDollarSign className="w-4 h-4" /> Registrar Recebimento
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#0f0f0f] border-white/10 text-white">
                  <DialogHeader>
                    <DialogTitle>Registrar Pagamento</DialogTitle>
                    <DialogDescription className="hidden">Registre um pagamento recebido ou pendente</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Data</label>
                      <Input 
                        type="date" 
                        value={paymentForm.date}
                        onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Valor (R$)</label>
                      <Input 
                        type="number" 
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})}
                        className="bg-white/5 border-white/10" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-widest text-white/40">Status</label>
                      <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({...paymentForm, status: v})}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                          <SelectItem value="paid">Pago</SelectItem>
                          <SelectItem value="pending">Pendente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
                    <Button className="bg-emerald-600" onClick={async () => {
                      try {
                        if (editingPaymentId) {
                          await updateInstagramPayment(editingPaymentId, {
                            date: paymentForm.date,
                            amount: paymentForm.amount,
                            status: paymentForm.status
                          });
                          toast.success("Pagamento atualizado");
                        } else {
                          await addInstagramPayment({
                            client_id: id!,
                            date: paymentForm.date,
                            amount: paymentForm.amount,
                            status: paymentForm.status
                          });
                          toast.success("Pagamento registrado");
                        }
                        setIsPaymentModalOpen(false);
                        setEditingPaymentId(null);
                        loadData(id!);
                      } catch (e: any) { console.error(e); toast.error(e?.message || "Erro ao salvar"); }
                    }}>Salvar</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card className="bg-[#0a0a0a] border-white/5">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[10px] uppercase tracking-widest text-white/40">
                    <tr>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Valor</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/2 transition-colors">
                        <td className="px-6 py-4 text-white/60">{format(new Date(p.date), 'MMMM yyyy', { locale: ptBR })}</td>
                        <td className="px-6 py-4 font-medium">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge className={`
                            text-[8px] uppercase tracking-widest border-none
                            ${p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}
                          `}>
                            {p.status === 'paid' ? 'Pago' : 'Pendente'}
                          </Badge>
                        </td>
                         <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-white/20 hover:text-white"
                              onClick={() => {
                                setEditingPaymentId(p.id);
                                setPaymentForm({
                                  date: p.date,
                                  amount: Number(p.amount),
                                  status: p.status
                                });
                                setIsPaymentModalOpen(true);
                              }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-white/20 hover:text-red-400"
                              onClick={async () => {
                                if (confirm("Deseja excluir este pagamento?")) {
                                  await deleteInstagramPayment(p.id);
                                  loadData(id!);
                                }
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
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
                          completed: false,
                          description: ""
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
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <CardTitle className={`text-sm font-medium mt-3 ${task.completed ? 'line-through text-white/20' : ''}`}>
                      {task.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-[10px] text-white/30">
                      <Calendar className="w-3 h-3" />
                      {task.due_date ? format(new Date(task.due_date), 'dd MMM', { locale: ptBR }) : 'Sem prazo'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&display=swap');
        .font-serif { font-family: 'Bodoni Moda', serif; }
      `}} />
    </div>
  );
};

export default AdminInstagramClient;
