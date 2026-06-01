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
  AlertCircle, Lock, Unlock, PieChart as PieChartIcon, RefreshCw, ArrowRight
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
  const [followerPeriod, setFollowerPeriod] = useState<'hoje' | 'semanal' | 'mensal' | 'total'>('semanal');
  
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
    link: "",
    image_url: ""
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

  const [isSyncingPosts, setIsSyncingPosts] = useState(false);
  const [isSyncingFollowers, setIsSyncingFollowers] = useState(false);
  const [liveFollowerCount, setLiveFollowerCount] = useState<number | null>(null);
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);
  const [scrappaPosts, setScrappaPosts] = useState<any[]>([]);
  const [isFetchingScrappa, setIsFetchingScrappa] = useState(false);
  const [importingPostLinks, setImportingPostLinks] = useState<string[]>([]);
  const [reachOverrides, setReachOverrides] = useState<Record<string, number>>({});
  const [selectedScrappaPosts, setSelectedScrappaPosts] = useState<Set<string>>(new Set());
  const [isBatchImporting, setIsBatchImporting] = useState(false);
  const [isBatchRemoving, setIsBatchRemoving] = useState(false);

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

  const SCRAPPA_KEY = 'eyJpdiI6IkFvZWk5dGNYOTRCajdlR1JTQm5aY1E9PSIsInZhbHVlIjoiK3hZRVpTOUQyYlIxOW1sc3c2U1VGRXZ1ZFUrSHE3cnVFdG12Q1B0aHZRNTl3NnVtd2t0QkdzMiswaUlZT0EvbTNHajUvWmQybVIwdE5lR3duZXAyUEE9PSIsIm1hYyI6IjczYmZkYWJlNjMwOTNjZWU4NTVjYWVjODg0MWY5MTA1MDBlODk3ZWM2ZDBmNTg1OWZkYzQwY2NiZDYwMTlmNzUiLCJ0YWciOiIifQ==';

  // Helper: extract views/reach from a Scrappa post object, covering all known field variations
  const getPostReach = (post: any, fallback: number = 0): number => {
    const candidates = [
      post.play_count,
      post.view_count,
      post.video_view_count,
      post.video_play_count,
      post.fb_play_count,
      post.ig_play_count,
      post.views,
      post.video_views,
      post.reach,
      post.impressions,
      post.metrics?.views,
      post.metrics?.reach,
      post.metrics?.impressions,
      post.metrics?.video_views,
      post.metrics?.plays,
      post.media?.[0]?.play_count,
      post.media?.[0]?.view_count,
      post.media?.[0]?.video_view_count,
    ];
    const value = candidates.find(v => typeof v === 'number' && v > 0);
    if (!value && value !== 0) {
      console.log('[Scrappa Debug] Nenhum campo de views encontrado para post:', post.shortcode || post.id, 'Campos disponíveis:', Object.keys(post));
    }
    return value || fallback;
  };

  // Helper: extract likes from a Scrappa post object
  const getPostLikes = (post: any, fallback: number = 0): number => {
    return post.like_count || post.likes_count || post.likes || post.metrics?.likes || fallback;
  };

  // Helper: extract comments from a Scrappa post object
  const getPostComments = (post: any, fallback: number = 0): number => {
    return post.comment_count || post.comments_count || post.comments || post.metrics?.comments || fallback;
  };


  const fetchScrappaData = async () => {
    if (!client?.username) throw new Error("Usuário não possui @ cadastrado");
    const cleanUsername = client.username.replace('@', '').trim();
    console.log("[Scrappa] Buscando posts para:", cleanUsername);
    
    let allPosts: any[] = [];
    let hasMore = true;
    let nextMaxId = '';
    let pageCount = 0;

    // Fetch up to 5 pages (about 60 posts) to avoid infinite loops or rate limits
    while (hasMore && pageCount < 5) {
      const url = `https://scrappa.co/api/instagram/user/posts?username=${cleanUsername}${nextMaxId ? `&max_id=${nextMaxId}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'x-api-key': SCRAPPA_KEY,
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      if (!data?.success && !data?.posts) {
        if (allPosts.length === 0) throw new Error(data?.message || "Erro ao buscar posts do perfil");
        break;
      }
      
      const postsList = data.posts || [];
      allPosts = [...allPosts, ...postsList];
      
      if (data.more_available && data.next_max_id) {
        nextMaxId = data.next_max_id;
        pageCount++;
      } else {
        hasMore = false;
      }
    }
    
    console.log(`[Scrappa] ${allPosts.length} posts encontrados no total`);
    if (allPosts.length > 0) {
      console.log('[Scrappa Debug] Estrutura do primeiro post:', JSON.stringify(allPosts[0], null, 2));
      console.log('[Scrappa Debug] Campos do primeiro post:', Object.keys(allPosts[0]));
    }
    return allPosts;
  };

  const handlePullLatestPost = async () => {
    if (!id || !client) return;
    setIsPullModalOpen(true);
    handleLoadScrappaPosts();
  };

  const handleSyncFollowers = async () => {
    if (!id || !client?.username) return;
    setIsSyncingFollowers(true);
    try {
      const cleanUsername = client.username.replace('@', '').trim();
      // Fetch profile info from Scrappa
      const res = await fetch(`https://scrappa.co/api/instagram/user?username=${cleanUsername}`, {
        headers: { 'x-api-key': SCRAPPA_KEY, 'Accept': 'application/json' }
      });
      const data = await res.json();

      console.log('[Scrappa User] Response:', JSON.stringify(data, null, 2));

      // Try multiple field paths for follower count
      const currentCount: number =
        data?.follower_count ??
        data?.followers_count ??
        data?.followers ??
        data?.edge_followed_by?.count ??
        data?.user?.follower_count ??
        data?.user?.followers_count ??
        data?.user?.edge_followed_by?.count ??
        data?.data?.follower_count ??
        data?.data?.followers_count ??
        data?.data?.edge_followed_by?.count ??
        null;

      if (currentCount === null || isNaN(Number(currentCount))) {
        throw new Error('Não foi possível obter a contagem de seguidores. Verifique se o @ está correto e público.');
      }

      const count = Number(currentCount);
      setLiveFollowerCount(count);

      const todayStr = new Date().toISOString().split('T')[0];

      // Check if there's already an entry for today
      const todayEntry = followers.find(f => f.date.split('T')[0] === todayStr);

      if (todayEntry) {
        // Update today's end count
        await updateFollowerEntry(todayEntry.id, {
          date: todayStr,
          followers_start: todayEntry.followers_start,
          followers_end: count
        });
        toast.success(`Atualizado: ${count.toLocaleString('pt-BR')} seguidores hoje!`);
      } else {
        // New day — start = last entry's end (or 0)
        const lastEntry = followers[0]; // already sorted newest first
        const startCount = lastEntry ? lastEntry.followers_end || lastEntry.followers_start : 0;
        await addFollowerEntry({
          client_id: id,
          date: todayStr,
          followers_start: startCount,
          followers_end: count
        });
        toast.success(`Novo dia registrado: ${count.toLocaleString('pt-BR')} seguidores!`);
      }

      loadData(id);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao sincronizar seguidores');
    } finally {
      setIsSyncingFollowers(false);
    }
  };

  const handleLoadScrappaPosts = async () => {
    setIsFetchingScrappa(true);
    try {
      const recentPosts = await fetchScrappaData();
      setScrappaPosts(recentPosts || []);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao carregar posts do Instagram");
    } finally {
      setIsFetchingScrappa(false);
    }
  };

  const isPostAlreadyImported = (scrappaPost: any) => {
    const permalink = scrappaPost.permalink || (scrappaPost.shortcode ? `https://www.instagram.com/p/${scrappaPost.shortcode}/` : scrappaPost.post_link || "");
    const shortcode = scrappaPost.shortcode || "";
    
    return posts.some(p => {
      const pLink = (p.post_link || "").toLowerCase().replace(/\/$/, '');
      const newLink = permalink.toLowerCase().replace(/\/$/, '');
      if (!pLink) return false;
      
      // Match by shortcode (most reliable)
      if (shortcode && pLink.includes(shortcode)) return true;
      
      // Match by permalink
      if (pLink === newLink) return true;
      if (newLink.includes(pLink) || pLink.includes(newLink)) return true;
      
      return false;
    });
  };

  const handleImportSinglePost = async (scrappaPost: any) => {
    if (!id) return;
    const permalink = scrappaPost.permalink || (scrappaPost.shortcode ? `https://www.instagram.com/p/${scrappaPost.shortcode}/` : scrappaPost.post_link || "");
    
    setImportingPostLinks(prev => [...prev, permalink]);
    try {
      const takenAt = scrappaPost.taken_at || scrappaPost.timestamp;
      const postDate = takenAt 
        ? new Date(takenAt).toISOString().split('T')[0] 
        : new Date().toISOString().split('T')[0];
      
      const isVideo = scrappaPost.is_video || scrappaPost.video_url || scrappaPost.product_type === 'clips' || scrappaPost.media_type === 'video';
      const imageUrl = scrappaPost.media?.[0]?.thumbnail_url || scrappaPost.media?.[0]?.images?.[0]?.url || scrappaPost.thumbnail_url || scrappaPost.display_url || "";
      
      const postKey = scrappaPost.shortcode || scrappaPost.id || permalink;
      const manualReach = reachOverrides[postKey];
      
      await addInstagramPost({
        client_id: id,
        date: postDate,
        type: isVideo ? 'reels' : 'feed',
        caption: scrappaPost.caption || scrappaPost.text || "",
        reach: manualReach !== undefined && manualReach > 0 ? manualReach : getPostReach(scrappaPost),
        likes: getPostLikes(scrappaPost),
        comments: getPostComments(scrappaPost),
        shares: scrappaPost.share_count || 0,
        saves: scrappaPost.save_count || 0,
        post_link: permalink,
        image_url: imageUrl
      });
      
      toast.success("Post importado com sucesso!");
      loadData(id);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao importar post");
    } finally {
      setImportingPostLinks(prev => prev.filter(link => link !== permalink));
    }
  };

  const togglePostSelection = (postKey: string) => {
    setSelectedScrappaPosts(prev => {
      const next = new Set(prev);
      if (next.has(postKey)) {
        next.delete(postKey);
      } else {
        next.add(postKey);
      }
      return next;
    });
  };

  const handleSelectAllNotImported = () => {
    const notImported = scrappaPosts.filter(p => !isPostAlreadyImported(p));
    const keys = notImported.map(p => p.shortcode || p.id || p.permalink || '');
    setSelectedScrappaPosts(new Set(keys));
  };

  const handleDeselectAll = () => {
    setSelectedScrappaPosts(new Set());
  };

  const handleBatchImport = async () => {
    if (!id || selectedScrappaPosts.size === 0) return;
    setIsBatchImporting(true);
    let successCount = 0;
    try {
      const postsToImport = scrappaPosts.filter(p => {
        const key = p.shortcode || p.id || p.permalink || '';
        return selectedScrappaPosts.has(key) && !isPostAlreadyImported(p);
      });

      for (const scrappaPost of postsToImport) {
        try {
          const permalink = scrappaPost.permalink || (scrappaPost.shortcode ? `https://www.instagram.com/p/${scrappaPost.shortcode}/` : scrappaPost.post_link || '');
          const takenAt = scrappaPost.taken_at || scrappaPost.timestamp;
          const postDate = takenAt ? new Date(takenAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
          const isVideo = scrappaPost.is_video || scrappaPost.video_url || scrappaPost.product_type === 'clips' || scrappaPost.media_type === 'video';
          const imageUrl = scrappaPost.media?.[0]?.thumbnail_url || scrappaPost.media?.[0]?.images?.[0]?.url || scrappaPost.thumbnail_url || scrappaPost.display_url || '';
          const postKey = scrappaPost.shortcode || scrappaPost.id || permalink;
          const manualReach = reachOverrides[postKey];

          await addInstagramPost({
            client_id: id,
            date: postDate,
            type: isVideo ? 'reels' : 'feed',
            caption: scrappaPost.caption || scrappaPost.text || '',
            reach: manualReach !== undefined && manualReach > 0 ? manualReach : getPostReach(scrappaPost),
            likes: getPostLikes(scrappaPost),
            comments: getPostComments(scrappaPost),
            shares: scrappaPost.share_count || 0,
            saves: scrappaPost.save_count || 0,
            post_link: permalink,
            image_url: imageUrl
          });
          successCount++;
        } catch (e) {
          console.error('Erro ao importar post:', e);
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} post${successCount > 1 ? 's' : ''} importado${successCount > 1 ? 's' : ''} com sucesso!`);
        loadData(id);
      }
      setSelectedScrappaPosts(new Set());
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao importar posts em lote');
    } finally {
      setIsBatchImporting(false);
    }
  };

  const handleBatchRemove = async () => {
    if (!id || selectedScrappaPosts.size === 0) return;
    setIsBatchRemoving(true);
    let removedCount = 0;
    try {
      for (const postKey of selectedScrappaPosts) {
        const matchingPost = posts.find(p => {
          const pLink = (p.post_link || '').toLowerCase().replace(/\/$/, '');
          if (postKey && pLink.includes(postKey)) return true;
          return false;
        });
        if (matchingPost) {
          await deleteInstagramPost(matchingPost.id);
          removedCount++;
        }
      }

      if (removedCount > 0) {
        toast.success(`${removedCount} post${removedCount > 1 ? 's' : ''} removido${removedCount > 1 ? 's' : ''} com sucesso!`);
        loadData(id);
      } else {
        toast.info('Nenhum post selecionado foi encontrado nos importados.');
      }
      setSelectedScrappaPosts(new Set());
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Erro ao remover posts em lote');
    } finally {
      setIsBatchRemoving(false);
    }
  };

  const handleUpdateAllPosts = async () => {
    if (!id || !client || posts.length === 0) return;
    setIsSyncingPosts(true);
    try {
      const recentPosts = await fetchScrappaData();
      if (!recentPosts || recentPosts.length === 0) {
        toast.info("Nenhum post encontrado no Scrappa para atualizar.");
        return;
      }

      let updatedCount = 0;
      for (const p of posts) {
        if (!p.post_link) continue;
        
        const scrappaMatch = recentPosts.find((rp: any) => {
          const rpLink = (rp.permalink || "").toLowerCase().replace(/\/$/, '');
          const shortcode = rp.shortcode || "";
          const pLink = p.post_link.toLowerCase().replace(/\/$/, '');
          
          if (shortcode && pLink.includes(shortcode)) return true;
          if (pLink === rpLink) return true;
          if (rpLink && (pLink.includes(rpLink) || rpLink.includes(pLink))) return true;
          
          return false;
        });

        if (scrappaMatch) {
          const imageUrl = scrappaMatch.media?.[0]?.thumbnail_url || scrappaMatch.media?.[0]?.images?.[0]?.url || scrappaMatch.thumbnail_url || scrappaMatch.display_url || "";
          
          await updateInstagramPost(p.id, {
            reach: getPostReach(scrappaMatch, p.reach),
            likes: getPostLikes(scrappaMatch, p.likes),
            comments: getPostComments(scrappaMatch, p.comments),
            caption: scrappaMatch.caption || scrappaMatch.text || p.caption,
            image_url: imageUrl || p.image_url
          });
          updatedCount++;
        }
      }

      if (updatedCount > 0) {
        toast.success(`${updatedCount} posts atualizados com os dados mais recentes!`);
        loadData(id);
      } else {
        toast.info("Não foi possível encontrar correspondências (verifique os links dos posts).");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao atualizar posts");
    } finally {
      setIsSyncingPosts(false);
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

  const followerGains = useMemo(() => {
    if (followers.length === 0) return { hoje: 0, semanal: 0, mensal: 0, total: 0 };
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Parse helper
    const parseLocalDate = (dateStr: string) => {
      if (!dateStr) return new Date(0);
      const parts = dateStr.split('T')[0].split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      return new Date(dateStr);
    };

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    let hojeGains = 0;
    let semanalGains = 0;
    let mensalGains = 0;
    let totalGains = 0;

    followers.forEach((f) => {
      const gain = f.followers_end - f.followers_start;
      const fDateStr = f.date.split('T')[0];
      
      // Hoje
      if (fDateStr === todayStr) {
        hojeGains += gain;
      }
      
      // Semanal (last 7 days)
      const d = parseLocalDate(f.date);
      if (d.getTime() >= sevenDaysAgo.getTime()) {
        semanalGains += gain;
      }

      // Mensal (last 30 days)
      if (d.getTime() >= thirtyDaysAgo.getTime()) {
        mensalGains += gain;
      }

      // Total
      totalGains += gain;
    });

    return {
      hoje: hojeGains,
      semanal: semanalGains,
      mensal: mensalGains,
      total: totalGains
    };
  }, [followers]);
  
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

  const likeGains = useMemo(() => {
    if (posts.length === 0) return { hoje: 0, semanal: 0, mensal: 0, total: 0 };
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date(); now.setHours(0,0,0,0);
    const sevenAgo = new Date(now); sevenAgo.setDate(now.getDate() - 7);
    const thirtyAgo = new Date(now); thirtyAgo.setDate(now.getDate() - 30);
    const parseD = (s: string) => { const p = s.split('T')[0].split('-'); return new Date(+p[0], +p[1]-1, +p[2]); };
    let hoje = 0, semanal = 0, mensal = 0, total = 0;
    posts.forEach(p => {
      const d = parseD(p.date);
      total += p.likes;
      if (p.date.split('T')[0] === todayStr) hoje += p.likes;
      if (d >= sevenAgo) semanal += p.likes;
      if (d >= thirtyAgo) mensal += p.likes;
    });
    return { hoje, semanal, mensal, total };
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
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <CardDescription className="text-[10px] uppercase tracking-widest font-black text-white/30">Crescimento</CardDescription>
                      <Users className="w-4 h-4 text-purple-400 opacity-50" />
                    </div>
                    
                    <div className="max-w-full overflow-x-auto no-scrollbar">
                      <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-lg text-[8px] uppercase tracking-wider font-bold w-fit min-w-max">
                        <button 
                          type="button"
                          onClick={() => setFollowerPeriod('hoje')} 
                          className={`px-2 py-0.5 rounded-md transition-all ${followerPeriod === 'hoje' ? 'bg-purple-600 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
                        >
                          Hoje
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFollowerPeriod('semanal')} 
                          className={`px-2 py-0.5 rounded-md transition-all ${followerPeriod === 'semanal' ? 'bg-purple-600 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
                        >
                          Semanal
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFollowerPeriod('mensal')} 
                          className={`px-2 py-0.5 rounded-md transition-all ${followerPeriod === 'mensal' ? 'bg-purple-600 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
                        >
                          Mensal
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFollowerPeriod('total')} 
                          className={`px-2 py-0.5 rounded-md transition-all ${followerPeriod === 'total' ? 'bg-purple-600 text-white shadow' : 'text-white/40 hover:text-white/70'}`}
                        >
                          Total
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <CardTitle className="text-2xl font-serif mt-2">
                    {followerGains[followerPeriod] >= 0 ? '+' : ''}
                    {followerGains[followerPeriod].toLocaleString('pt-BR')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {followerPeriod === 'hoje' ? 'Ganhos de hoje' : followerPeriod === 'semanal' ? 'Ganhos da semana' : followerPeriod === 'mensal' ? 'Ganhos do mês' : 'Crescimento Total'}
                  </div>
                  <div className="text-[9px] text-white/20 mt-1.5 uppercase font-bold">
                    Total: {followerStats?.current.toLocaleString('pt-BR') || 0}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/5 relative overflow-hidden group hover:bg-white/[0.04] transition-all">
                <div className="absolute top-0 left-0 w-1 h-full bg-pink-500" />
                <CardHeader className="pb-2">
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <CardDescription className="text-[10px] uppercase tracking-widest font-black text-white/30">Likes</CardDescription>
                      <Heart className="w-4 h-4 text-pink-400 opacity-50" />
                    </div>
                    <div className="max-w-full overflow-x-auto no-scrollbar">
                      <div className="flex bg-white/5 border border-white/10 p-0.5 rounded-lg text-[8px] uppercase tracking-wider font-bold w-fit min-w-max">
                        {(['hoje','semanal','mensal','total'] as const).map(p => (
                          <button key={p} type="button" onClick={() => setFollowerPeriod(p)}
                            className={`px-2 py-0.5 rounded-md transition-all ${followerPeriod === p ? 'bg-pink-600 text-white shadow' : 'text-white/40 hover:text-white/70'}`}>
                            {p === 'hoje' ? 'Hoje' : p === 'semanal' ? '7d' : p === 'mensal' ? '30d' : 'Total'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-serif mt-2">
                    {likeGains[followerPeriod].toLocaleString('pt-BR')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                    {followerPeriod === 'hoje' ? 'Likes de hoje' : followerPeriod === 'semanal' ? 'Likes dos 7 dias' : followerPeriod === 'mensal' ? 'Likes dos 30 dias' : 'Total de likes'}
                  </div>
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
                  <div className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Importadas</div>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-serif">Lançamento de Seguidores</h3>
                {liveFollowerCount !== null && (
                  <p className="text-[10px] text-purple-400 uppercase tracking-widest mt-0.5">
                    Última leitura: <span className="font-bold">{liveFollowerCount.toLocaleString('pt-BR')}</span> seguidores
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Auto-sync button */}
                <Button
                  onClick={handleSyncFollowers}
                  disabled={isSyncingFollowers}
                  className="bg-purple-600 hover:bg-purple-700 gap-2 text-xs"
                >
                  {isSyncingFollowers ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Atualizar via Instagram
                </Button>
              <Dialog open={isFollowerModalOpen} onOpenChange={(open) => {
                setIsFollowerModalOpen(open);
                if (!open) setEditingFollowerId(null);
              }}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    className="border-white/10 text-white/60 hover:text-white gap-2"
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
                    <Plus className="w-4 h-4" /> Manual
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
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card className="bg-[#0a0a0a] border-white/5">
                
                {/* Mobile View */}
                <div className="md:hidden flex flex-col divide-y divide-white/5">
                  {followers.map(f => {
                    const isAnalysis = f.followers_end === 0;
                    const diff = f.followers_end - f.followers_start;
                    const pct = f.followers_start !== 0 ? ((diff / f.followers_start) * 100).toFixed(2) : "0";
                    return (
                      <div key={f.id} className="p-4 flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{formatLocalDate(f.date, 'dd/MM/yyyy')}</span>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-white" onClick={() => {
                                setEditingFollowerId(f.id);
                                setFollowerForm({
                                  date: f.date,
                                  start: f.followers_start,
                                  end: f.followers_end,
                                  isAnalysis: f.followers_end === 0
                                });
                                setIsFollowerModalOpen(true);
                            }}>
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-red-400" onClick={async () => {
                                if (confirm("Deseja excluir este registro?")) {
                                  await deleteFollowerEntry(f.id);
                                  loadData(id!);
                                }
                            }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between bg-white/[0.02] p-3 rounded-lg border border-white/5">
                           <div className="flex flex-col">
                             <span className="text-[9px] uppercase text-white/30 tracking-widest mb-1">Início</span>
                             <span className="font-mono text-sm">{f.followers_start.toLocaleString('pt-BR')}</span>
                           </div>
                           <ArrowRight className="w-4 h-4 text-white/10" />
                           <div className="flex flex-col items-end">
                             <span className="text-[9px] uppercase text-white/30 tracking-widest mb-1">Fim</span>
                             {isAnalysis ? (
                               <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[8px] uppercase tracking-tighter">Análise</Badge>
                             ) : (
                               <span className="font-mono text-sm">{f.followers_end.toLocaleString('pt-BR')}</span>
                             )}
                           </div>
                        </div>
                        <div className="flex items-center justify-between px-1">
                           <span className="text-[10px] uppercase text-white/40 tracking-widest font-bold">Resultado</span>
                           <div className="flex items-center gap-2">
                             <span className={`font-bold ${isAnalysis ? 'text-white/20' : (diff >= 0 ? 'text-emerald-400' : 'text-red-400')}`}>
                               {isAnalysis ? '--' : (diff > 0 ? `+${diff.toLocaleString('pt-BR')}` : diff.toLocaleString('pt-BR'))}
                             </span>
                             {!isAnalysis && <span className="text-white/30 text-[10px]">({pct}%)</span>}
                           </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop View */}
                <div className="hidden md:block overflow-x-auto">
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
            <div className="flex flex-col lg:flex-row lg:justify-between items-start lg:items-center gap-4">
              <h3 className="text-lg font-serif whitespace-nowrap">Relatório de Postagens</h3>
              <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-1 -mb-1">
                <Button 
                  variant="outline" 
                  className="border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white gap-2 text-[10px] sm:text-sm"
                  onClick={handlePullLatestPost}
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Puxar Posts</span>
                  <span className="sm:hidden">Puxar</span>
                </Button>

                {/* Dialog to pull/import Instagram posts */}
                <Dialog open={isPullModalOpen} onOpenChange={setIsPullModalOpen}>
                  <DialogContent className="bg-[#0f0f0f] border-white/10 text-white max-w-[90vw] xl:max-w-7xl h-[85vh] flex flex-col p-6 rounded-2xl">
                    <DialogHeader className="flex flex-row justify-between items-center border-b border-white/5 pb-4">
                      <div>
                        <DialogTitle className="text-xl font-bold flex items-center gap-2">
                          <Instagram className="w-5 h-5 text-purple-400" />
                          Importar Publicações do Instagram
                        </DialogTitle>
                        <DialogDescription className="text-white/40 mt-1">
                          Selecione quais posts do perfil de {client.username} você deseja registrar.
                        </DialogDescription>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleLoadScrappaPosts}
                        disabled={isFetchingScrappa}
                        className="text-white/60 hover:text-white hover:bg-white/5 h-9 w-9 rounded-full mr-6"
                      >
                        <RefreshCw className={`w-4 h-4 ${isFetchingScrappa ? 'animate-spin' : ''}`} />
                      </Button>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-6 pr-1">
                      {isFetchingScrappa ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 gap-3">
                          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
                          <p className="text-xs text-white/40 uppercase tracking-widest font-black">Buscando publicações recentes...</p>
                        </div>
                      ) : scrappaPosts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center py-20 text-center">
                          <ImageIcon className="w-12 h-12 text-white/10 mb-4" />
                          <p className="text-xs text-white/30 uppercase tracking-widest font-black">Nenhum post recente encontrado</p>
                          <p className="text-[10px] text-white/10 mt-1">Verifique se o @{client.username} está correto e público no Instagram.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          {scrappaPosts.map((post: any, idx: number) => {
                            const isImported = isPostAlreadyImported(post);
                            const permalink = post.permalink || (post.shortcode ? `https://www.instagram.com/p/${post.shortcode}/` : post.post_link || "");
                            const isImporting = importingPostLinks.includes(permalink);
                            const isVideo = post.is_video || post.video_url || post.product_type === 'clips' || post.media_type === 'video';
                            const imageUrl = post.media?.[0]?.thumbnail_url || post.media?.[0]?.images?.[0]?.url || post.thumbnail_url || post.display_url || "";
                            
                            // Metrics (using centralized helpers for robust field extraction)
                            const likes = getPostLikes(post);
                            const comments = getPostComments(post);
                            const apiReach = getPostReach(post);
                            const postKey = post.shortcode || post.id || permalink;
                            const reach = reachOverrides[postKey] !== undefined ? reachOverrides[postKey] : apiReach;

                            return (
                              <Card 
                                key={post.id || idx} 
                                className={`bg-white/[0.02] border-2 transition-all flex flex-col overflow-hidden relative group cursor-pointer ${
                                  selectedScrappaPosts.has(postKey)
                                    ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-500/[0.04]'
                                    : 'border-white/5 hover:border-purple-500/20'
                                }`}
                                onClick={(e) => {
                                  // Don't toggle if clicking on the reach input or buttons
                                  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return;
                                  togglePostSelection(postKey);
                                }}
                              >
                                {/* Selection checkbox */}
                                <div className="absolute top-3 right-3 z-10">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                                    selectedScrappaPosts.has(postKey)
                                      ? 'bg-purple-500 border-purple-500'
                                      : 'border-white/30 bg-black/40 backdrop-blur-sm hover:border-white/50'
                                  }`}>
                                    {selectedScrappaPosts.has(postKey) && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    )}
                                  </div>
                                </div>
                                {/* Selection overlay */}
                                {selectedScrappaPosts.has(postKey) && (
                                  <div className="absolute inset-0 z-[5] pointer-events-none flex items-center justify-center">
                                    <div className="absolute inset-0 bg-purple-600/10" />
                                  </div>
                                )}
                                <div className="absolute top-3 left-3 z-10">
                                  <Badge className="bg-black/60 backdrop-blur-md text-white border-white/10 text-[8px] uppercase tracking-widest">
                                    {isVideo ? 'Reels' : 'Feed'}
                                  </Badge>
                                </div>
                                <div className="w-full h-44 overflow-hidden relative bg-black/40">
                                  {imageUrl ? (
                                    <img src={imageUrl} alt="Capa do post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/15">
                                      <ImageIcon className="w-8 h-8" />
                                    </div>
                                  )}
                                </div>
                                <CardHeader className="p-3 pb-0">
                                  <p className="text-[10px] text-white/30">
                                    {post.taken_at || post.timestamp ? formatLocalDate(post.taken_at || post.timestamp, 'dd MMM yyyy') : '-'}
                                  </p>
                                </CardHeader>
                                <CardContent className="p-3 flex-1 flex flex-col justify-between gap-3">
                                  <p className="text-xs text-white/60 line-clamp-2 italic">
                                    "{post.caption || post.text || 'Sem legenda'}"
                                  </p>
                                  <div className="grid grid-cols-3 gap-1 py-1.5 border-y border-white/5 text-center bg-white/[0.01] rounded-lg">
                                    <div>
                                      <p className="text-[7px] text-white/30 uppercase">Likes</p>
                                      <p className="text-[11px] font-bold">{likes.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-[7px] text-white/30 uppercase">Coment.</p>
                                      <p className="text-[11px] font-bold">{comments.toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-[7px] text-white/30 uppercase">Views</p>
                                      {apiReach === 0 && !isImported ? (
                                        <input
                                          type="number"
                                          placeholder="0"
                                          value={reachOverrides[postKey] || ''}
                                          onChange={(e) => setReachOverrides(prev => ({
                                            ...prev,
                                            [postKey]: Number(e.target.value) || 0
                                          }))}
                                          className="w-full bg-purple-500/10 border border-purple-500/30 rounded text-[11px] font-bold text-center text-purple-300 h-5 px-1 focus:outline-none focus:border-purple-500/60 placeholder:text-white/20"
                                          title="Insira o alcance do Instagram Insights"
                                        />
                                      ) : (
                                        <p className="text-[11px] font-bold">{reach.toLocaleString()}</p>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                                <CardFooter className="p-3 pt-0 mt-auto">
                                  {isImported ? (
                                    <div className="w-full flex items-center justify-center gap-1 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs h-9">
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      Já Importado
                                    </div>
                                  ) : (
                                    <div className={`w-full flex items-center justify-center gap-1 py-1.5 rounded-md text-xs h-9 transition-all ${
                                      selectedScrappaPosts.has(postKey)
                                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 font-bold'
                                        : 'bg-white/5 text-white/30 border border-white/5'
                                    }`}>
                                      {selectedScrappaPosts.has(postKey) ? (
                                        <><CheckCircle2 className="w-3.5 h-3.5" /> SELECIONADO</>
                                      ) : (
                                        'Clique para selecionar'
                                      )}
                                    </div>
                                  )}
                                </CardFooter>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <DialogFooter className="border-t border-white/5 pt-4 mt-auto">
                      <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-3">
                        {/* Left: selection controls */}
                        <div className="flex items-center gap-2 text-xs">
                          {scrappaPosts.length > 0 && (
                            <>
                              <span className="text-white/30">
                                {selectedScrappaPosts.size} de {scrappaPosts.filter(p => !isPostAlreadyImported(p)).length} selecionado{selectedScrappaPosts.size !== 1 ? 's' : ''}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleSelectAllNotImported}
                                className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 text-xs h-7 px-2"
                              >
                                Selecionar Todos
                              </Button>
                              {selectedScrappaPosts.size > 0 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={handleDeselectAll}
                                  className="text-white/40 hover:text-white/60 hover:bg-white/5 text-xs h-7 px-2"
                                >
                                  Desmarcar
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                        {/* Right: action buttons */}
                        <div className="flex items-center gap-2">
                          {selectedScrappaPosts.size > 0 && (
                            <>
                              {/* Show remove button if any selected post is already imported */}
                              {Array.from(selectedScrappaPosts).some(key => 
                                posts.some(p => (p.post_link || '').toLowerCase().includes(key))
                              ) && (
                                <Button
                                  onClick={handleBatchRemove}
                                  disabled={isBatchRemoving}
                                  className="bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 text-xs h-9 gap-1.5"
                                >
                                  {isBatchRemoving ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                  Remover ({Array.from(selectedScrappaPosts).filter(key => 
                                    posts.some(p => (p.post_link || '').toLowerCase().includes(key))
                                  ).length})
                                </Button>
                              )}
                              {/* Import button for non-imported selected posts */}
                              {(() => {
                                const importableCount = Array.from(selectedScrappaPosts).filter(key => {
                                  const sp = scrappaPosts.find(p => (p.shortcode || p.id || p.permalink || '') === key);
                                  return sp && !isPostAlreadyImported(sp);
                                }).length;
                                return importableCount > 0 ? (
                                  <Button
                                    onClick={handleBatchImport}
                                    disabled={isBatchImporting}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs h-9 gap-1.5 font-bold"
                                  >
                                    {isBatchImporting ? (
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    ) : (
                                      <Download className="w-3.5 h-3.5" />
                                    )}
                                    Importar Selecionados ({importableCount})
                                  </Button>
                                ) : null;
                              })()}
                            </>
                          )}
                          <Button onClick={() => { setIsPullModalOpen(false); setSelectedScrappaPosts(new Set()); }} className="bg-white/10 hover:bg-white/20 text-white">
                            Fechar
                          </Button>
                        </div>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  className="border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-white gap-2 text-[10px] sm:text-sm"
                  onClick={handleUpdateAllPosts}
                  disabled={isSyncingPosts}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPosts ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Atualizar Todos</span>
                  <span className="sm:hidden">Atualizar</span>
                </Button>
                <Dialog open={isPostModalOpen} onOpenChange={(open) => {
                  setIsPostModalOpen(open);
                  if (!open) setEditingPostId(null);
                }}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 gap-2 text-[10px] sm:text-sm"
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
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">Link do Post (Opcional)</label>
                        <Input 
                          value={postForm.link}
                          onChange={(e) => setPostForm({...postForm, link: e.target.value})}
                          placeholder="https://..." 
                          className="bg-white/5 border-white/10" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-widest text-white/40">URL da Capa (Opcional)</label>
                        <Input 
                          value={postForm.image_url}
                          onChange={(e) => setPostForm({...postForm, image_url: e.target.value})}
                          placeholder="https://..." 
                          className="bg-white/5 border-white/10" 
                        />
                      </div>
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
                        image_url: postForm.image_url,
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
            </div>

            {(() => {
              // Group posts by "YYYY-MM"
              const groups = posts.reduce<Record<string, typeof posts>>((acc, post) => {
                const key = post.date.split('T')[0].slice(0, 7); // "YYYY-MM"
                if (!acc[key]) acc[key] = [];
                acc[key].push(post);
                return acc;
              }, {});
              const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));

              if (sortedKeys.length === 0) return (
                <div className="py-20 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-[2rem]">
                  <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-[10px] uppercase tracking-widest text-white/30 font-black">Nenhuma publicação importada</p>
                  <p className="text-xs text-white/10 mt-1">Sincronize com o Instagram no modal de integrações</p>
                </div>
              );

              return (
                <div className="space-y-8">
                  {sortedKeys.map(key => {
                    const [year, month] = key.split('-');
                    const groupPosts = groups[key];
                    const monthTotalLikes = groupPosts.reduce((s, p) => s + p.likes, 0);
                    const monthTotalComments = groupPosts.reduce((s, p) => s + p.comments, 0);
                    const monthTotalReach = groupPosts.reduce((s, p) => s + p.reach, 0);
                    const monthLabel = new Date(+year, +month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

                    return (
                      <div key={key}>
                        {/* Month header */}
                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold capitalize text-white">{monthLabel}</span>
                            <span className="text-[10px] uppercase tracking-widest text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                              {groupPosts.length} post{groupPosts.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-white/40">
                            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-pink-400" fill="currentColor" />{monthTotalLikes.toLocaleString()}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3 text-blue-400" />{monthTotalComments.toLocaleString()}</span>
                            {monthTotalReach > 0 && <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-emerald-400" />{monthTotalReach >= 1000 ? (monthTotalReach/1000).toFixed(1)+'k' : monthTotalReach}</span>}
                          </div>
                        </div>

                        {/* Posts grid for this month */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-px bg-white/5 rounded-lg overflow-hidden">
                          {groupPosts.map((post) => (
                            <div key={post.id} className="flex flex-col bg-[#0a0a0a] group cursor-pointer">
                              <div className="relative aspect-square overflow-hidden">
                                {post.image_url ? (
                                  <img src={post.image_url} alt="Capa" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-white/[0.03]">
                                    <ImageIcon className="w-6 h-6 text-white/10" />
                                  </div>
                                )}
                                {/* Badge */}
                                <div className="absolute top-1.5 left-1.5 z-10">
                                  {post.type === 'reels' ? (
                                    <div className="bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5 flex items-center gap-1">
                                      <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                                      <span className="text-[8px] text-white font-bold uppercase tracking-wider">Reels</span>
                                    </div>
                                  ) : post.type === 'carrossel' ? (
                                    <div className="bg-black/60 backdrop-blur-sm rounded px-1.5 py-0.5">
                                      <span className="text-[8px] text-white font-bold">⊞</span>
                                    </div>
                                  ) : null}
                                </div>
                                {/* Hover overlay (Only on desktop lg screens) */}
                                <div className="hidden lg:flex absolute inset-0 bg-black/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-200 flex-col items-center justify-center gap-2 z-20 p-2">
                                  <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-center">
                                      <Heart className="w-4 h-4 text-white mb-0.5" fill="white" />
                                      <span className="text-white text-xs font-bold">{post.likes.toLocaleString()}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                      <MessageSquare className="w-4 h-4 text-white mb-0.5" fill="white" />
                                      <span className="text-white text-xs font-bold">{post.comments.toLocaleString()}</span>
                                    </div>
                                    {post.reach > 0 && (
                                      <div className="flex flex-col items-center">
                                        <Eye className="w-4 h-4 text-white mb-0.5" />
                                        <span className="text-white text-xs font-bold">{post.reach >= 1000 ? (post.reach/1000).toFixed(1)+'k' : post.reach}</span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-white/50 text-[9px] uppercase tracking-widest">{formatLocalDate(post.date, 'dd MMM')}</span>
                                  <div className="flex items-center gap-1">
                                    <button className="h-7 w-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                      onClick={() => { setEditingPostId(post.id); setPostForm({ date: post.date, type: post.type, caption: post.caption, reach: post.reach, likes: post.likes, comments: post.comments, shares: post.shares, saves: post.saves, link: post.post_link, image_url: post.image_url || "" }); setIsPostModalOpen(true); }}>
                                      <Edit2 className="w-3 h-3 text-white" />
                                    </button>
                                    <button className="h-7 w-7 rounded-full bg-white/10 hover:bg-red-500/40 flex items-center justify-center transition-colors"
                                      onClick={async () => { if (confirm("Excluir post?")) { await deleteInstagramPost(post.id); loadData(id!); } }}>
                                      <Trash2 className="w-3 h-3 text-white" />
                                    </button>
                                    {post.post_link && (
                                      <a href={post.post_link} target="_blank" rel="noreferrer" className="h-7 w-7 rounded-full bg-white/10 hover:bg-purple-500/40 flex items-center justify-center transition-colors">
                                        <ExternalLink className="w-3 h-3 text-white" />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {/* Stats bar */}
                              <div className="px-1 py-1.5 sm:px-2 flex items-center justify-between bg-[#0d0d0d] border-t border-white/[0.04]">
                                <div className="flex items-center gap-1.5 sm:gap-2 text-[7px] xs:text-[8px] sm:text-[9px] text-white/50">
                                  <span className="flex items-center gap-0.5"><Heart className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-pink-400" fill="currentColor" />{post.likes.toLocaleString()}</span>
                                  <span className="flex items-center gap-0.5"><MessageSquare className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-blue-400" />{post.comments.toLocaleString()}</span>
                                  {post.reach > 0 && <span className="flex items-center gap-0.5"><Eye className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-emerald-400" />{post.reach >= 1000 ? (post.reach/1000).toFixed(1)+'k' : post.reach}</span>}
                                </div>
                                <div className="flex items-center gap-0.5">
                                  <button className="h-4 w-4 sm:h-5 sm:w-5 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                                    onClick={() => { setEditingPostId(post.id); setPostForm({ date: post.date, type: post.type, caption: post.caption, reach: post.reach, likes: post.likes, comments: post.comments, shares: post.shares, saves: post.saves, link: post.post_link, image_url: post.image_url || "" }); setIsPostModalOpen(true); }}>
                                    <Edit2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                  </button>
                                  <button className="h-4 w-4 sm:h-5 sm:w-5 rounded flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                    onClick={async () => { if (confirm("Excluir post?")) { await deleteInstagramPost(post.id); loadData(id!); } }}>
                                    <Trash2 className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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

