import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Search, 
  Instagram, 
  Users, 
  Image as ImageIcon, 
  Heart, 
  MessageSquare, 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  UserPlus,
  CheckCircle2,
  ChevronRight,
  TrendingDown,
  Activity,
  Calendar,
  Grid3X3,
  BarChart3,
  User,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  getInstagramClients, 
  createInstagramClient, 
  addFollowerEntry, 
  addInstagramPost,
  getFollowerHistory,
  getInstagramPosts,
  InstagramClient,
  fetchScrappaPosts
} from '@/lib/instagram';
import { 
  Clock,
} from "lucide-react";

interface InstagramIntegrationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ScrappaUserData {
  username: string;
  full_name: string;
  biography: string;
  profile_pic_url_hd: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  is_private: boolean;
  is_verified: boolean;
  external_url?: string;
  recent_posts?: any[];
}

const SCRAPPA_KEY = 'eyJpdiI6IkFvZWk5dGNYOTRCajdlR1JTQm5aY1E9PSIsInZhbHVlIjoiK3hZRVpTOUQyYlIxOW1sc3c2U1VGRXZ1ZFUrSHE3cnVFdG12Q1B0aHZRNTl3NnVtd2t0QkdzMiswaUlZT0EvbTNHajUvWmQybVIwdE5lR3duZXAyUEE9PSIsIm1hYyI6IjczYmZkYWJlNjMwOTNjZWU4NTVjYWVjODg0MWY5MTA1MDBlODk3ZWM2ZDBmNTg1OWZkYzQwY2NiZDYwMTlmNzUiLCJ0YWciOiIifQ==';

export function InstagramIntegrationsModal({ isOpen, onClose, onSuccess }: InstagramIntegrationsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<ScrappaUserData | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ScrappaUserData[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<ScrappaUserData | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importMonthlyValue, setImportMonthlyValue] = useState<number>(0);
  const [importPaymentDay, setImportPaymentDay] = useState<number>(1);

  const [selectedHistory, setSelectedHistory] = useState<any[]>([]);
  const [selectedPosts, setSelectedPosts] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadConnectedAccounts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedAccount) {
      loadAccountDetails();
    }
  }, [selectedAccount]);

  const loadAccountDetails = async () => {
    if (!selectedAccount) return;
    try {
      const clients = await getInstagramClients();
      const client = clients.find(c => c.username.replace('@', '').toLowerCase() === selectedAccount.username.toLowerCase());
      
      if (client) {
        const history = await getFollowerHistory(client.id);
        setSelectedHistory(history.map(h => ({
          date: h.date,
          followers: h.followers_end
        })).reverse());

        const posts = await getInstagramPosts(client.id);
        setSelectedPosts(posts);
      }
    } catch (error) {
      console.error("Error loading details:", error);
    }
  };

  const loadConnectedAccounts = async () => {
    try {
      const clients = await getInstagramClients();
      // Map clients to ScrappaUserData format as much as possible
      const mappedAccounts: ScrappaUserData[] = clients.map(c => ({
        username: c.username.replace('@', ''),
        full_name: c.name,
        biography: c.notes || "",
        profile_pic_url_hd: c.profile_picture || "",
        follower_count: 0, // We'll need to fetch these or handle them
        following_count: 0,
        media_count: 0,
        is_private: false,
        is_verified: false,
      }));
      setConnectedAccounts(mappedAccounts);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    setSearchResult(null);

    const cleanUsername = searchQuery.replace('@', '').trim();

    try {
      const response = await fetch(`https://scrappa.co/api/instagram/user?username=${cleanUsername}`, {
        headers: {
          'x-api-key': SCRAPPA_KEY,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data?.success && data?.user) {
        let normalizedUser = { ...data.user };
        normalizedUser.follower_count = data.user.follower_count ?? data.user.followers_count ?? data.user.followers ?? data.user.edge_followed_by?.count ?? 0;
        normalizedUser.following_count = data.user.following_count ?? data.user.following ?? data.user.edge_follow?.count ?? 0;
        normalizedUser.media_count = data.user.media_count ?? data.user.posts_count ?? data.user.posts ?? data.user.edge_owner_to_timeline_media?.count ?? 0;
        
        setSearchResult(normalizedUser);
        toast.success("Perfil encontrado!");
      } else {
        toast.error(data?.message || "Perfil não encontrado.");
      }
    } catch (error) {
      toast.error("Erro ao conectar com Scrappa API");
    } finally {
      setIsSearching(false);
    }
  };

  const handleImport = async (userData: ScrappaUserData) => {
    setIsSyncing(true);
    try {
      // 1. Get existing clients to see if this one exists
      const clients = await getInstagramClients();
      let client = clients.find(c => c.username.replace('@', '').toLowerCase() === userData.username.toLowerCase());

      if (!client) {
        // Create new client
        client = await createInstagramClient({
          name: userData.full_name || userData.username,
          username: `@${userData.username}`,
          profile_picture: userData.profile_pic_url_hd,
          niche: "Instagram Import",
          monthly_value: importMonthlyValue,
          payment_day: importPaymentDay,
          status: 'ativo',
          notes: userData.biography,
          start_date: new Date().toISOString().split('T')[0]
        });
        toast.success(`Cliente @${userData.username} criado no sistema!`);
      }

      // 2. Add follower history for today (safeguard values)
      const validFollowers = Number(userData.follower_count) || 0;
      await addFollowerEntry({
        client_id: client.id,
        date: new Date().toISOString().split('T')[0],
        followers_start: validFollowers,
        followers_end: validFollowers
      });

      // 3. Add posts if available
      if (userData.recent_posts && Array.isArray(userData.recent_posts)) {
        let postsCount = 0;
        for (const post of userData.recent_posts.slice(0, 15)) {
          try {
            // Scrappa posts endpoint structure can vary
            const takenAt = post.taken_at || post.timestamp || Math.floor(Date.now() / 1000);
            const caption = post.caption?.text || post.caption || post.text || "";
            const isVideo = post.is_video || post.video_url || post.product_type === 'clips';
            const type = isVideo ? 'reels' : 'feed';
            
            await addInstagramPost({
              client_id: client.id,
              date: new Date(takenAt * 1000).toISOString().split('T')[0],
              type: type,
              caption: caption,
              reach: post.play_count || post.view_count || post.video_view_count || 0,
              likes: post.like_count || post.likes_count || post.likes || 0,
              comments: post.comment_count || post.comments_count || post.comments || 0,
              shares: post.share_count || 0,
              saves: post.save_count || 0,
              post_link: post.permalink || (post.shortcode ? `https://instagram.com/p/${post.shortcode}/` : post.post_link || "")
            });
            postsCount++;
          } catch (e) {
            // Probably duplicate or error, skip
          }
        }
        if (postsCount > 0) {
          toast.success(`${postsCount} posts importados!`);
        }
      }

      toast.success("Dados sincronizados com o sistema!");
      
      if (onSuccess) onSuccess();
      
      // Update local state to reflect connection
      if (!connectedAccounts.some(acc => acc.username === userData.username)) {
        setConnectedAccounts([...connectedAccounts, userData]);
      }
      setSelectedAccount(userData);
      setSearchResult(null);
      setSearchQuery("");
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao importar dados para o sistema.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnect = () => {
    if (!searchResult) return;
    handleImport(searchResult);
  };

  const syncAccount = async () => {
    if (!selectedAccount) return;
    setIsSyncing(true);
    
    try {
      const response = await fetch(`https://scrappa.co/api/instagram/user?username=${selectedAccount.username}`, {
        headers: {
          'x-api-key': SCRAPPA_KEY,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data?.success && data?.user) {
        let normalizedUser = { ...data.user };
        normalizedUser.follower_count = data.user.follower_count ?? data.user.followers_count ?? data.user.followers ?? data.user.edge_followed_by?.count ?? 0;
        normalizedUser.following_count = data.user.following_count ?? data.user.following ?? data.user.edge_follow?.count ?? 0;
        normalizedUser.media_count = data.user.media_count ?? data.user.posts_count ?? data.user.posts ?? data.user.edge_owner_to_timeline_media?.count ?? 0;

        await handleImport(normalizedUser);
        toast.success(`Dados de @${selectedAccount.username} sincronizados!`);
      } else {
        toast.error("Não foi possível obter dados atualizados.");
      }
    } catch (error) {
      toast.error("Erro na sincronização");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-[1200px] w-full h-[90vh] p-0 bg-[#050505] border-white/10 shadow-2xl overflow-hidden flex flex-col rounded-3xl sm:max-w-none">
        <DialogHeader className="p-6 border-b border-white/5 shrink-0 bg-background/50 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 p-0.5 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Instagram className="w-6 h-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black tracking-tight text-white">Integrações Instagram</DialogTitle>
                <DialogDescription className="text-white/30 text-[10px] uppercase tracking-widest font-bold">Monitoramento Avançado Scrappa API • Hub de Inteligência</DialogDescription>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                  <Input 
                    placeholder="Adicionar @username..." 
                    className="w-48 md:w-80 bg-white/5 border-white/10 pl-10 h-11 rounded-2xl focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
               </div>
               <Button 
                onClick={handleSearch} 
                disabled={isSearching}
                className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-8 h-11 font-bold shadow-lg shadow-purple-600/20 active:scale-95 transition-all"
               >
                 {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Buscar Perfil"}
               </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Accounts List */}
          <aside className="w-80 border-r border-white/5 bg-[#080808] flex flex-col shrink-0">
            <div className="p-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 flex items-center gap-2">
                <Users className="w-3 h-3" /> Contas Integradas
              </h3>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {connectedAccounts.length === 0 ? (
                  <div className="px-4 py-12 text-center">
                    <p className="text-[10px] text-white/20 uppercase tracking-widest leading-loose">
                      Nenhuma conta<br/>conectada ainda.
                    </p>
                  </div>
                ) : (
                  connectedAccounts.map((acc) => (
                    <button
                      key={acc.username}
                      onClick={() => setSelectedAccount(acc)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedAccount?.username === acc.username ? 'bg-purple-500/10 border border-purple-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                    >
                      <div className="w-10 h-10 rounded-full border border-white/10 p-0.5 overflow-hidden">
                        <img src={acc.profile_pic_url_hd} alt={acc.username} className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-black text-white truncate">@{acc.username}</p>
                        <p className="text-[10px] text-white/40 truncate font-medium">{(acc.follower_count || 0).toLocaleString()} seguidores</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${selectedAccount?.username === acc.username ? 'text-purple-400 translate-x-0' : 'text-white/5 -translate-x-2'}`} />
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Main Dashboard Area */}
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#050505] to-[#0a0a0a] p-6 scrollbar-hide">
            <AnimatePresence mode="wait">
              {searchResult ? (
                /* Search Result Card */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="max-w-4xl mx-auto"
                >
                  <Card className="bg-white/[0.03] border-white/10 shadow-2xl rounded-3xl overflow-hidden glassmorphism">
                    <div className="h-32 bg-gradient-to-tr from-purple-600/20 to-pink-500/20 relative">
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent opacity-50" />
                    </div>
                    <CardHeader className="flex flex-row items-end gap-6 -mt-16 pb-6 relative z-10">
                      <div className="w-28 h-28 rounded-full border-4 border-[#050505] p-1 bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl">
                        <img src={searchResult.profile_pic_url_hd} alt="" className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h2 className="text-2xl font-black text-white">@{searchResult.username}</h2>
                          {searchResult.is_verified && <CheckCircle2 className="w-5 h-5 text-blue-400" />}
                        </div>
                        <p className="text-white/60 font-bold">{searchResult.full_name}</p>
                      </div>
                      <Button 
                        onClick={handleConnect}
                        className="bg-purple-600 text-white hover:bg-purple-700 rounded-2xl px-6 font-black uppercase text-[10px] tracking-widest mb-2 shadow-xl active:scale-95 transition-all"
                      >
                        Importar para Sistema
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-3 gap-4 border-y border-white/5 py-6">
                         <div className="text-center">
                           <p className="text-2xl font-black text-white">{(searchResult.media_count || 0).toLocaleString()}</p>
                           <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1">Publicações</p>
                         </div>
                         <div className="text-center border-x border-white/5">
                           <p className="text-2xl font-black text-white">{(searchResult.follower_count || 0).toLocaleString()}</p>
                           <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1">Seguidores</p>
                         </div>
                         <div className="text-center">
                           <p className="text-2xl font-black text-white">{(searchResult.following_count || 0).toLocaleString()}</p>
                           <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mt-1">Seguindo</p>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-purple-500/5 p-6 rounded-3xl border border-purple-500/10">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-purple-400">Valor Combinado (Mensal)</label>
                           <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-purple-400 text-sm">R$</span>
                              <Input 
                                type="number"
                                value={importMonthlyValue}
                                onChange={(e) => setImportMonthlyValue(Number(e.target.value))}
                                className="bg-white/5 border-white/10 pl-10 h-12 rounded-2xl focus:border-purple-500 text-white font-bold"
                                placeholder="0,00"
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest text-purple-400">Dia de Vencimento</label>
                           <Input 
                             type="number"
                             min={1}
                             max={31}
                             value={importPaymentDay}
                             onChange={(e) => setImportPaymentDay(Number(e.target.value))}
                             className="bg-white/5 border-white/10 h-12 rounded-2xl focus:border-purple-500 text-white font-bold"
                             placeholder="Ex: 5"
                           />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="bg-white/2 p-4 rounded-2xl border border-white/5">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-2">Biografia</h4>
                           <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{searchResult.biography}</p>
                           {searchResult.external_url && (
                             <a href={searchResult.external_url} target="_blank" className="text-purple-400 text-xs font-bold hover:underline block mt-2">
                               {searchResult.external_url}
                             </a>
                           )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : selectedAccount ? (
                /* Individual Dashboard Content */
                <motion.div
                  key={selectedAccount.username}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 rounded-full border-2 border-purple-500/30 p-1">
                        <img src={selectedAccount.profile_pic_url_hd} alt="" className="w-full h-full object-cover rounded-full" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-3xl font-black text-white">@{selectedAccount.username}</h2>
                          {selectedAccount.is_verified && <CheckCircle2 className="w-6 h-6 text-blue-400" />}
                        </div>
                        <p className="text-white/40 font-bold uppercase tracking-[0.2em] text-[10px] mt-1">{selectedAccount.full_name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        onClick={syncAccount}
                        disabled={isSyncing}
                        className="bg-white/5 border-white/10 text-white rounded-2xl px-6 font-bold hover:bg-white/10"
                      >
                        {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        Sincronizar agora
                      </Button>
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white rounded-2xl px-6 font-bold shadow-lg shadow-purple-600/20">
                        Exportar Relatório
                      </Button>
                    </div>
                  </div>

                  <Tabs defaultValue="perfil" className="w-full">
                    <TabsList className="bg-white/5 border border-white/10 p-1 rounded-2xl w-full sm:w-auto overflow-x-auto scrollbar-hide">
                      <TabsTrigger value="perfil" className="rounded-xl px-8 h-10 data-[state=active]:bg-white data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest gap-2">
                        <User className="w-3.5 h-3.5" /> Perfil
                      </TabsTrigger>
                      <TabsTrigger value="posts" className="rounded-xl px-8 h-10 data-[state=active]:bg-white data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest gap-2">
                        <Grid3X3 className="w-3.5 h-3.5" /> Posts
                      </TabsTrigger>
                      <TabsTrigger value="stats" className="rounded-xl px-8 h-10 data-[state=active]:bg-white data-[state=active]:text-black font-black uppercase text-[10px] tracking-widest gap-2">
                        <BarChart3 className="w-3.5 h-3.5" /> Estatísticas
                      </TabsTrigger>
                    </TabsList>

                    <ScrollArea className="h-[calc(90vh-320px)] mt-6 pr-4">
                      {/* Perfil Tab Content */}
                      <TabsContent value="perfil" className="m-0 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden p-6 hover:bg-white/[0.04] transition-all">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6 flex items-center gap-2">
                              <Activity className="w-3.5 h-3.5 text-purple-400" /> Preview de Perfil
                            </h3>
                            {/* Instagram Real UI Preview */}
                            <div className="max-w-md mx-auto bg-black rounded-3xl border border-white/10 overflow-hidden text-white shadow-2xl p-6">
                              <div className="flex items-center gap-6 mb-6">
                                <div className="w-20 h-20 rounded-full border-2 border-gradient p-0.5 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                                  <img src={selectedAccount.profile_pic_url_hd} alt="" className="w-full h-full object-cover rounded-full border-2 border-black" />
                                </div>
                                <div className="flex-1 flex justify-around">
                                  <div className="text-center">
                                    <p className="font-bold text-sm">{selectedAccount.media_count}</p>
                                    <p className="text-[10px] text-white/50">posts</p>
                                  </div>
                                  <div className="text-center">
                                     <p className="font-bold text-sm">{((selectedAccount.follower_count || 0) / 1000).toFixed(1)}k</p>
                                    <p className="text-[10px] text-white/50">seguidores</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-sm">{selectedAccount.following_count}</p>
                                    <p className="text-[10px] text-white/50">seguindo</p>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-1 mb-6">
                                <p className="font-bold text-xs">@{selectedAccount.username}</p>
                                <p className="text-xs text-white/90">{selectedAccount.biography}</p>
                                {selectedAccount.external_url && (
                                  <p className="text-xs text-blue-400 truncate">{selectedAccount.external_url}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button className="flex-1 h-8 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold">Seguir</Button>
                                <Button className="flex-1 h-8 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold">Mensagem</Button>
                              </div>
                            </div>
                          </Card>

                          <div className="space-y-6">
                             <Card className="bg-white/[0.02] border-white/5 rounded-3xl overflow-hidden p-6">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4">Informações Gerais</h3>
                                <div className="space-y-4">
                                   <div className="flex justify-between items-center py-3 border-b border-white/5">
                                      <span className="text-xs text-white/40">Status da Conta</span>
                                      <Badge className="bg-emerald-500/10 text-emerald-400 border-none text-[10px] uppercase font-black px-3 py-1">Público</Badge>
                                   </div>
                                   <div className="flex justify-between items-center py-3 border-b border-white/5">
                                      <span className="text-xs text-white/40">Sincronizado há</span>
                                      <span className="text-xs font-bold text-white">5 minutos</span>
                                   </div>
                                   <div className="flex justify-between items-center py-3 border-b border-white/5">
                                      <span className="text-xs text-white/40">Engajamento Médio</span>
                                      <span className="text-xs font-bold text-purple-400">4.82%</span>
                                   </div>
                                </div>
                             </Card>

                             <div className="grid grid-cols-2 gap-4">
                                <div className="p-5 rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/10">
                                   <p className="text-[9px] uppercase tracking-widest font-black text-purple-400 mb-1">Taxa de Conversão</p>
                                   <p className="text-2xl font-black">2.4%</p>
                                </div>
                                <div className="p-5 rounded-[2rem] bg-gradient-to-br from-pink-500/10 to-transparent border border-pink-500/10">
                                   <p className="text-[9px] uppercase tracking-widest font-black text-pink-400 mb-1">Crescimento Mês</p>
                                   <p className="text-2xl font-black">+14.2%</p>
                                </div>
                             </div>
                          </div>
                        </div>
                      </TabsContent>

                      {/* Posts Tab Content */}
                       <TabsContent value="posts" className="m-0">
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                             {selectedPosts.length === 0 ? (
                               <div className="col-span-full py-20 text-center text-white/20">
                                 Nenhum post importado ainda.
                               </div>
                             ) : (
                               selectedPosts.map((post) => (
                                 <Card key={post.id} className="group relative aspect-square rounded-2xl overflow-hidden border-none bg-white/5 hover:scale-[1.02] transition-all cursor-pointer">
                                    <a href={post.post_link} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-[10px] text-white/20 p-2 text-center overflow-hidden">
                                        {post.caption?.substring(0, 50)}...
                                      </div>
                                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                         <div className="flex flex-col items-center gap-1">
                                           <Heart className="w-5 h-5 text-white fill-white" />
                                           <span className="text-[10px] font-black text-white">{post.likes}</span>
                                         </div>
                                         <div className="flex flex-col items-center gap-1">
                                           <MessageSquare className="w-5 h-5 text-white" />
                                           <span className="text-[10px] font-black text-white">{post.comments}</span>
                                         </div>
                                      </div>
                                    </a>
                                 </Card>
                               ))
                             )}
                          </div>
                       </TabsContent>

                      {/* Stats Tab Content */}
                      <TabsContent value="stats" className="m-0 space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <Card className="bg-white/[0.02] border-white/5 rounded-3xl p-6">
                             <div className="flex items-center justify-between mb-8">
                                <div>
                                  <h3 className="text-sm font-black text-white">Crescimento de Seguidores</h3>
                                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Últimos 30 dias</p>
                                </div>
                                <div className="flex items-center gap-2 text-emerald-400">
                                   <TrendingUp className="w-4 h-4" />
                                   <span className="text-xs font-black">+420</span>
                                </div>
                             </div>
                             <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={selectedHistory.length > 0 ? selectedHistory : [{date: new Date().toISOString(), followers: selectedAccount.follower_count}]}>
                                    <defs>
                                      <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                      </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                    <XAxis 
                                      dataKey="date" 
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fill: '#ffffff30', fontSize: 10 }}
                                      tickFormatter={(val) => format(new Date(val), 'dd MMM')}
                                    />
                                    <YAxis 
                                      axisLine={false}
                                      tickLine={false}
                                      tick={{ fill: '#ffffff30', fontSize: 10 }}
                                    />
                                    <Tooltip 
                                      contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                                      itemStyle={{ color: '#a855f7' }}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="followers" 
                                      stroke="#a855f7" 
                                      strokeWidth={3}
                                      fillOpacity={1} 
                                      fill="url(#colorFollow)" 
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                             </div>
                          </Card>

                          <Card className="bg-white/[0.02] border-white/5 rounded-3xl p-6">
                             <div className="flex items-center justify-between mb-8">
                                <div>
                                  <h3 className="text-sm font-black text-white">Engajamento por Dia</h3>
                                  <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mt-1">Interações médias</p>
                                </div>
                                <Badge className="bg-purple-500/10 text-purple-400 border-none px-3">Top: Domingo</Badge>
                             </div>
                             <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={selectedPosts.slice(0, 7).map(p => ({ name: format(new Date(p.date), 'dd/MM'), engagement: ((p.likes + p.comments) / 100).toFixed(2) }))}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                                      <XAxis 
                                        dataKey="name" 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#ffffff30', fontSize: 10 }}
                                      />
                                      <YAxis 
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#ffffff30', fontSize: 10 }}
                                      />
                                      <Tooltip 
                                        contentStyle={{ backgroundColor: '#111', border: '1px solid #ffffff10', borderRadius: '12px', fontSize: '10px' }}
                                        cursor={{ fill: '#ffffff02' }}
                                      />
                                      <Bar dataKey="engagement" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={20} />
                                   </BarChart>
                                </ResponsiveContainer>
                             </div>
                          </Card>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           {[
                             { label: 'Sexta às 18:00', value: 'Melhor Horário', icon: Clock, color: 'text-blue-400' },
                             { label: 'Vídeo/Reels', value: 'Melhor Formato', icon: Grid3X3, color: 'text-pink-400' },
                             { label: '2.4 posts/dia', value: 'Frequência Ideal', icon: Calendar, color: 'text-emerald-400' }
                           ].map((item, i) => (
                              <Card key={i} className="bg-white/[0.02] border-white/5 p-6 rounded-3xl flex items-center gap-4">
                                 <div className={`p-3 rounded-2xl bg-white/5 ${item.color}`}>
                                    <item.icon className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="text-[10px] uppercase tracking-widest font-black text-white/30">{item.label}</p>
                                    <p className="text-sm font-black text-white">{item.value}</p>
                                 </div>
                              </Card>
                           ))}
                        </div>
                      </TabsContent>
                    </ScrollArea>
                  </Tabs>
                </motion.div>
              ) : (
                /* Empty / Welcome State */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="h-full flex flex-col items-center justify-center text-center space-y-8"
                >
                  <div className="w-32 h-32 rounded-[3rem] bg-gradient-to-tr from-purple-600/20 to-pink-500/20 flex items-center justify-center relative group">
                    <div className="absolute inset-0 bg-purple-500/10 rounded-[3rem] blur-2xl group-hover:bg-purple-500/20 transition-all" />
                    <Instagram className="w-16 h-16 text-purple-400 relative z-10" strokeWidth={1.5} />
                  </div>
                  <div className="max-w-xl space-y-3">
                    <h3 className="text-4xl font-black text-white tracking-tight">Comece sua Jornada</h3>
                    <p className="text-white/40 text-base leading-relaxed">
                      Utilize a Scrappa API para conectar contas do Instagram e obter análises em tempo real, posts recentes e estatísticas de engajamento.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="px-6 py-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col items-center gap-1">
                       <p className="text-lg font-black text-white">500</p>
                       <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Créditos API</p>
                    </div>
                    <div className="px-6 py-4 bg-white/2 border border-white/5 rounded-2xl flex flex-col items-center gap-1">
                       <p className="text-lg font-black text-white">∞</p>
                       <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Monitoramento</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </DialogContent>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .glassmorphism {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}} />
    </Dialog>
  );
}
