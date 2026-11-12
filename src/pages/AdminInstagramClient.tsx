import { useState, useEffect, useMemo, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Instagram, ArrowLeft, MessageSquare, Heart, Calendar, Check,
  CheckCircle2, Plus, MoreVertical, Edit2, Trash2, Download,
  ExternalLink, Camera, Eye, Image as ImageIcon, Send, AlertCircle,
  Lock, Unlock, RefreshCw, ArrowRight, ShieldAlert, ArrowDownRight,
  Receipt, ListTodo, Loader2, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
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
  InstagramExpense,
  fetchScrappaProfile,
  fetchScrappaPosts,
} from "@/lib/instagram";
import { uploadToImageKit } from "@/lib/imagekit";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AdminPage, Panel, Field, StatusBadge, EmptyState, Segmented, LoadingBlock, FlyTabs, FlySwitch } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

// ── Presentation helpers (visual only) ──
type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const CLIENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  ativo: { label: "Ativo", tone: "success" },
  pendente: { label: "Pendente", tone: "warning" },
  pausado: { label: "Pausado", tone: "info" },
  cancelado: { label: "Encerrado", tone: "danger" },
};

const PRIORITY_TONE: Record<string, Tone> = { urgente: "danger", alta: "warning", "média": "info", baixa: "neutral" };
const TASK_TYPE_LABEL: Record<string, string> = { task: "Tarefa", idea: "Ideia", pauta: "Pauta", checklist: "Checklist" };

const brl = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const compact = (value: number) => (value >= 1000 ? (value / 1000).toFixed(1) + 'k' : String(value));
const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const CHART_GRID = "hsl(var(--border))";
const CHART_AXIS = {
  stroke: "hsl(var(--border))",
  tick: { fill: "hsl(var(--muted-foreground))", fontSize: 12 },
  tickLine: false,
} as const;
const CHART_TOOLTIP = {
  contentStyle: {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontSize: 13,
    color: "hsl(var(--foreground))",
  },
  labelStyle: { color: "hsl(var(--muted-foreground))" },
  itemStyle: { color: "hsl(var(--foreground))" },
  cursor: { fill: "hsl(var(--accent))", stroke: "hsl(var(--border))" },
};

/** Plain number with a label, no decoration. */
function Metric({ label, value, hint, className }: { label: ReactNode; value: ReactNode; hint?: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[13px] text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-[20px] font-semibold tabular-nums text-foreground">{value}</dd>
      {hint && <dd className="mt-0.5 text-[13px] text-muted-foreground">{hint}</dd>}
    </div>
  );
}

const thClass = "px-5 py-3 text-left text-[13px] font-medium text-muted-foreground";
const tdClass = "px-5 py-3 text-[14px]";
const rowClass = "border-b border-border last:border-0 transition-colors duration-150 hover:bg-accent/40";
const dialogScroll = "max-h-[90vh] overflow-y-auto";

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
  const [showEncerradoAlert, setShowEncerradoAlert] = useState(false);
  const [encerradoAlertAction, setEncerradoAlertAction] = useState("");

  const handleEncerradoCapture = (e: React.MouseEvent) => {
    if (client?.status !== 'cancelado') return;
    const target = e.target as HTMLElement;
    const btn = target.closest('button, [role="button"], [role="menuitem"], [role="switch"], a, label');
    if (!btn) return;
    const text = btn.textContent?.toLowerCase().trim() || '';
    const isSafe = ['voltar', 'geral', 'seguidores', 'posts', 'contrato', 'tarefas', 'financeiro', 'sair', 'entendi', 'cancelar', 'x'].some(
      s => text === s || text.startsWith(s + ' ') || text.endsWith(' ' + s)
    );
    if (isSafe) return;
    e.preventDefault();
    e.stopPropagation();
    setEncerradoAlertAction(client.name);
    setShowEncerradoAlert(true);
  };

  const isEncerrado = () => client?.status === 'cancelado';

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
        { fn: () => getFollowerHistory(clientId, 90), setter: setFollowers, name: "Seguidores", default: [] },
        { fn: () => getInstagramPosts(clientId, 90), setter: setPosts, name: "Posts", default: [] },
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
    
    let allPosts: any[] = [];
    let hasMore = true;
    let nextMaxId: string | undefined;
    let pageCount = 0;

    while (hasMore && pageCount < 5) {
      const postsList = await fetchScrappaPosts(cleanUsername, nextMaxId);
      
      if (!Array.isArray(postsList)) {
        if (allPosts.length === 0) throw new Error("Erro ao buscar posts do perfil");
        break;
      }
      
      allPosts = [...allPosts, ...postsList];
      
      if (postsList.length > 0) {
        const lastPost = postsList[postsList.length - 1];
        nextMaxId = lastPost?.id || lastPost?.shortcode || undefined;
        pageCount++;
      } else {
        hasMore = false;
      }
    }
    
    return allPosts;
  };

  const handlePullLatestPost = async () => {
    if (!id || !client || isEncerrado()) return;
    setIsPullModalOpen(true);
    handleLoadScrappaPosts();
  };

  const handleSyncFollowers = async () => {
    if (!id || !client?.username || isEncerrado()) return;
    setIsSyncingFollowers(true);
    try {
      const cleanUsername = client.username.replace('@', '').trim();
      const data = await fetchScrappaProfile(cleanUsername);

      if (data?.success === false) {
        throw new Error(data?.message || 'Não foi possível buscar dados do perfil');
      }

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
        data?.result?.follower_count ??
        data?.result?.followers_count ??
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
        // New day — start = current count (or last entry's end if exists)
        const lastEntry = followers[0];
        const startCount = lastEntry ? (lastEntry.followers_end || lastEntry.followers_start) : count;
        await addFollowerEntry({
          client_id: id,
          date: todayStr,
          followers_start: startCount,
          followers_end: count
        });
        toast.success(`Novo dia registrado: ${count.toLocaleString('pt-BR')} seguidores!`);
      }

      // Mark client as "pendente" (análise)
      await updateInstagramClient(id, { status: 'pendente' });

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
    if (!id || isEncerrado()) return;
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
    if (!id || selectedScrappaPosts.size === 0 || isEncerrado()) return;
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
    if (!id || selectedScrappaPosts.size === 0 || isEncerrado()) return;
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
    if (!id || !client || posts.length === 0 || isEncerrado()) return;
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
    if (!id || isEncerrado()) return;
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


  const handleAddExpense = async () => {
    if (isEncerrado()) return;
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
    if (isEncerrado()) return;
    if (!confirm("Excluir este gasto?")) return;
    try {
      await deleteInstagramExpense(expenseId);
      toast.success("Gasto excluído");
      loadData(id!);
    } catch (e: any) { toast.error("Erro ao excluir"); }
  };

  const backLink = (
    <Button variant="ghost" size="sm" className="-ml-2 gap-2 text-muted-foreground" onClick={() => navigate("/admin/instagram")}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar para Instagram
    </Button>
  );

  if (loading || !client) {
    return (
      <AdminPage title="Cliente do Instagram" back={backLink}>
        <LoadingBlock label="Carregando cliente…" />
      </AdminPage>
    );
  }

  // Derived values for display (same functions as before, computed once per render)
  const status = CLIENT_STATUS[client.status] ?? { label: client.status, tone: "neutral" as Tone };
  const instagramUrl = `https://instagram.com/${client.username.replace('@', '')}`;
  const contractSchedule = getContractSchedule();
  const nextPaymentDue = getNextPaymentDue();
  const nextPaymentCountdown = getNextPaymentCountdown();
  const installmentValue = contractForm.contract_installment_value || getComputedInstallmentValue();
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const todayOnly = (() => { const t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); })();
  const periodGainLabel = followerPeriod === 'hoje' ? 'Ganhos de hoje' : followerPeriod === 'semanal' ? 'Ganhos da semana' : followerPeriod === 'mensal' ? 'Ganhos do mês' : 'Crescimento total';
  const periodLikesLabel = followerPeriod === 'hoje' ? 'Likes de hoje' : followerPeriod === 'semanal' ? 'Likes dos 7 dias' : followerPeriod === 'mensal' ? 'Likes dos 30 dias' : 'Total de likes';
  const openTasks = tasks.filter((t) => !t.completed).length;

  // Lets the external Instagram link work like before (it lived outside the guarded area).
  const guardedCapture = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-encerrado-safe]')) return;
    handleEncerradoCapture(e);
  };

  const openEditFollower = (f: FollowerHistory) => {
    setEditingFollowerId(f.id);
    setFollowerForm({
      date: f.date,
      start: f.followers_start,
      end: f.followers_end,
      isAnalysis: f.followers_end === 0
    });
    setIsFollowerModalOpen(true);
  };

  const deleteFollower = async (f: FollowerHistory) => {
    if (isEncerrado()) return;
    if (confirm("Deseja excluir este registro?")) {
      await deleteFollowerEntry(f.id);
      loadData(id!);
    }
  };

  const openEditPost = (post: InstagramPost) => {
    setEditingPostId(post.id);
    setPostForm({ date: post.date, type: post.type, caption: post.caption, reach: post.reach, likes: post.likes, comments: post.comments, shares: post.shares, saves: post.saves, link: post.post_link, image_url: post.image_url || "" });
    setIsPostModalOpen(true);
  };

  const removePost = async (post: InstagramPost) => {
    if (isEncerrado()) return;
    if (confirm("Excluir post?")) { await deleteInstagramPost(post.id); loadData(id!); }
  };

  const openEditPayment = (p: InstagramPayment) => {
    setEditingPaymentId(p.id);
    setPaymentForm({ date: p.date, amount: Number(p.amount), status: p.status });
    setIsPaymentModalOpen(true);
  };

  const removePayment = async (p: InstagramPayment) => {
    if (isEncerrado()) return;
    if (confirm("Excluir?")) { await deleteInstagramPayment(p.id); loadData(id!); }
  };

  const resetNewTask = () => {
    setEditingTaskId(null);
    setTaskForm({
      title: "",
      priority: "média",
      type: "task",
      due_date: new Date().toISOString().split('T')[0]
    });
  };

  const openEditTask = (task: InstagramTask) => {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      priority: task.priority,
      type: task.type,
      due_date: task.due_date
    });
    setIsTaskModalOpen(true);
  };

  const resetNewPost = () => {
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
    } as typeof postForm);
  };

  const followerDiffClass = (isAnalysis: boolean, diff: number) =>
    isAnalysis ? 'text-muted-foreground' : diff >= 0 ? 'text-[hsl(var(--admin-success))]' : 'text-destructive';

  const tabTrigger = "min-h-[40px] rounded-md px-3.5 py-1.5 text-[14px] font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none";

  return (
    <>
      <div onClickCapture={guardedCapture}>
        <AdminPage
          back={backLink}
          title={client.name}
          description={
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
              <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              <span>{client.username}</span>
              {client.niche && <><span aria-hidden="true">·</span><span>{client.niche}</span></>}
              <span aria-hidden="true">·</span>
              <span>Pagamento dia {client.payment_day}</span>
            </span>
          }
          actions={
            <>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" aria-hidden="true" /> Relatório
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" aria-hidden="true" /> Ação rápida
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem className="cursor-pointer" onClick={() => { setActiveTab('posts'); setIsPostModalOpen(true); }}>Novo post</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => { setActiveTab('followers'); setIsFollowerModalOpen(true); }}>Registrar seguidores</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => { setActiveTab('tasks'); setIsTaskModalOpen(true); }}>Nova tarefa</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => { setActiveTab('contract'); }}>Contrato</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => { setActiveTab('finance'); setIsPaymentModalOpen(true); }}>Registrar pagamento</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          }
        >
          {/* ── Profile and key numbers ── */}
          <section aria-label="Perfil e números principais" className="mb-6 flex flex-col gap-5 rounded-xl border border-border bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-secondary">
                {client.profile_picture ? (
                  <img
                    src={client.profile_picture}
                    alt={`Foto de perfil de ${client.name}`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`fallback-icon flex h-full w-full items-center justify-center ${client.profile_picture ? 'hidden' : ''}`}>
                  <Camera className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                </div>
              </div>
              <div className="min-w-0">
                <a
                  data-encerrado-safe
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1.5 rounded-md text-[15px] font-medium text-foreground underline-offset-4 hover:underline"
                >
                  <span className="truncate">{client.username}</span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">(abre o perfil no Instagram)</span>
                </a>
                <p className="truncate text-[13px] text-muted-foreground">{client.name}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-4">
              <Metric label="Seguidores" value={(followerStats?.current || 0).toLocaleString('pt-BR')} />
              <Metric label="Postagens" value={posts.length} hint="Importadas" />
              <Metric label="Tarefas abertas" value={openTasks} />
              <div className="min-w-0">
                <dt className="text-[13px] text-muted-foreground">Financeiro</dt>
                <dd className="mt-1.5">
                  <StatusBadge tone={financialStats.pendingCount > 0 ? 'warning' : 'success'}>
                    {financialStats.pendingCount > 0 ? 'Pendente' : 'Em dia'}
                  </StatusBadge>
                </dd>
                <dd className="mt-1 text-[13px] text-muted-foreground">Dia {client.payment_day}</dd>
              </div>
            </dl>
          </section>

          <FlyTabs value={activeTab} onValueChange={setActiveTab}>
            <div className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <TabsList className="h-auto w-max justify-start gap-1 rounded-lg border border-border bg-muted p-1">
                <TabsTrigger value="overview" className={tabTrigger}>Geral</TabsTrigger>
                <TabsTrigger value="followers" className={tabTrigger}>Seguidores</TabsTrigger>
                <TabsTrigger value="posts" className={tabTrigger}>Posts</TabsTrigger>
                <TabsTrigger value="contract" className={tabTrigger}>Contrato</TabsTrigger>
                <TabsTrigger value="tasks" className={tabTrigger}>Tarefas</TabsTrigger>
                <TabsTrigger value="finance" className={tabTrigger}>Financeiro</TabsTrigger>
              </TabsList>
            </div>

            {/* 1. VISÃO GERAL */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <Panel
                title="Crescimento"
                description="Seguidores e likes no período escolhido"
                actions={
                  <Segmented<"hoje" | "semanal" | "mensal" | "total">
                    label="Período"
                    value={followerPeriod}
                    onChange={setFollowerPeriod}
                    options={[
                      { value: 'hoje', label: 'Hoje' },
                      { value: 'semanal', label: '7 dias' },
                      { value: 'mensal', label: '30 dias' },
                      { value: 'total', label: 'Total' },
                    ]}
                  />
                }
              >
<FlySwitch group="Período" value={followerPeriod}>
                <dl data-fly className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <Metric
                    label="Seguidores ganhos"
                    value={`${followerGains[followerPeriod] >= 0 ? '+' : ''}${followerGains[followerPeriod].toLocaleString('pt-BR')}`}
                    hint={`${periodGainLabel} · Total: ${followerStats?.current.toLocaleString('pt-BR') || 0}`}
                  />
                  <Metric
                    label="Likes"
                    value={likeGains[followerPeriod].toLocaleString('pt-BR')}
                    hint={periodLikesLabel}
                  />
                </dl>
                </FlySwitch>
              </Panel>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel title="Crescimento de seguidores" description="Últimos lançamentos">
                  {followers.length === 0 ? (
                    <EmptyState icon={<Users />} title="Sem lançamentos ainda" description="Registre seguidores na aba Seguidores para ver o gráfico." className="py-10" />
                  ) : (
                    <div className="h-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={followerStats?.history || []} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                          <XAxis dataKey="date" {...CHART_AXIS} tickFormatter={(val) => formatLocalDate(val, 'dd/MM')} />
                          <YAxis {...CHART_AXIS} axisLine={false} width={56} />
                          <Tooltip {...CHART_TOOLTIP} labelFormatter={(label) => formatLocalDate(label, 'dd/MM/yyyy')} />
                          <Area name="Seguidores" type="monotone" dataKey="followers_end" stroke="hsl(var(--foreground))" fill="hsl(var(--foreground))" fillOpacity={0.06} strokeWidth={2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Panel>

                <Panel title="Distribuição de conteúdo" description="Por tipo de postagem">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        margin={{ top: 8, right: 8, left: -8, bottom: 0 }}
                        data={[
                          { name: 'Reels', count: posts.filter(p => p.type === 'reels').length },
                          { name: 'Story', count: posts.filter(p => p.type === 'story').length },
                          { name: 'Feed', count: posts.filter(p => p.type === 'feed').length },
                          { name: 'Carrossel', count: posts.filter(p => p.type === 'carrossel').length },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} vertical={false} />
                        <XAxis dataKey="name" {...CHART_AXIS} />
                        <YAxis {...CHART_AXIS} axisLine={false} allowDecimals={false} width={40} />
                        <Tooltip {...CHART_TOOLTIP} />
                        <Bar name="Total de posts" dataKey="count" fill="hsl(var(--admin-info))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Panel>
              </div>
            </TabsContent>

            {/* 2. CONTROLE DE SEGUIDORES */}
            <TabsContent value="followers" className="mt-0">
              <Panel
                title="Lançamento de seguidores"
                description={
                  liveFollowerCount !== null ? (
                    <>Última leitura: <span className="font-medium tabular-nums text-foreground">{liveFollowerCount.toLocaleString('pt-BR')}</span> seguidores</>
                  ) : (
                    'Registro diário do início e do fim de cada dia'
                  )
                }
                bodyClassName="p-0"
                actions={
                  <>
                    <Button onClick={handleSyncFollowers} disabled={isSyncingFollowers} className="gap-2">
                      <RefreshCw className={cn("h-4 w-4", isSyncingFollowers && "animate-spin")} aria-hidden="true" />
                      Atualizar via Instagram
                    </Button>
                    <Dialog open={isFollowerModalOpen} onOpenChange={(open) => {
                      setIsFollowerModalOpen(open);
                      if (!open) setEditingFollowerId(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="gap-2"
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
                          <Plus className="h-4 w-4" aria-hidden="true" /> Manual
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={dialogScroll} onClickCapture={handleEncerradoCapture}>
                        <DialogHeader>
                          <DialogTitle className="text-[20px]">Registrar seguidores</DialogTitle>
                          <DialogDescription className="text-[14px]">Insira os dados de hoje ou de uma data específica.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                          <Field label="Data" htmlFor="follower-date">
                            <Input
                              id="follower-date"
                              type="date"
                              value={followerForm.date}
                              onChange={(e) => setFollowerForm({...followerForm, date: e.target.value})}
                            />
                          </Field>
                          <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-secondary p-3">
                            <div className="min-w-0">
                              <label htmlFor="follower-analysis" className="text-[14px] font-medium text-foreground">Ainda em análise?</label>
                              <p className="text-[13px] text-muted-foreground">Marque se o dia ainda não acabou</p>
                            </div>
                            <Switch
                              id="follower-analysis"
                              checked={followerForm.isAnalysis}
                              onCheckedChange={(checked) => setFollowerForm({...followerForm, isAnalysis: checked, end: checked ? 0 : followerForm.end})}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="Início do dia" htmlFor="follower-start">
                              <Input
                                id="follower-start"
                                type="number"
                                inputMode="numeric"
                                value={followerForm.start || ""}
                                onChange={(e) => setFollowerForm({...followerForm, start: e.target.value === "" ? 0 : Number(e.target.value)})}
                              />
                            </Field>
                            <Field label="Fim do dia" htmlFor="follower-end">
                              <Input
                                id="follower-end"
                                type="number"
                                inputMode="numeric"
                                disabled={followerForm.isAnalysis}
                                placeholder={followerForm.isAnalysis ? "Em análise…" : "0"}
                                value={followerForm.isAnalysis ? "" : (followerForm.end || "")}
                                onChange={(e) => setFollowerForm({...followerForm, end: e.target.value === "" ? 0 : Number(e.target.value)})}
                              />
                            </Field>
                          </div>
                        </div>
                        <DialogFooter className="gap-2">
                          <Button variant="ghost" onClick={() => setIsFollowerModalOpen(false)}>Cancelar</Button>
                          <Button onClick={async () => {
                            if (isEncerrado()) { setIsFollowerModalOpen(false); return; }
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
                  </>
                }
              >
                {followers.length === 0 ? (
                  <div className="p-5">
                    <EmptyState
                      icon={<Users />}
                      title="Nenhum registro de seguidores"
                      description="Use Atualizar via Instagram para ler o número atual, ou registre manualmente."
                    />
                  </div>
                ) : (
                  <>
                    {/* Phones */}
                    <ul className="divide-y divide-border md:hidden">
                      {followers.map(f => {
                        const isAnalysis = f.followers_end === 0;
                        const diff = f.followers_end - f.followers_start;
                        const pct = f.followers_start !== 0 ? ((diff / f.followers_start) * 100).toFixed(2) : "0";
                        const dateLabel = formatLocalDate(f.date, 'dd/MM/yyyy');
                        return (
                          <li key={f.id} className="flex flex-col gap-3 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[14px] font-medium tabular-nums text-foreground">{dateLabel}</span>
                              <div className="-mr-2 flex">
                                <Button variant="ghost" size="icon" aria-label={`Editar registro de ${dateLabel}`} className="text-muted-foreground hover:text-foreground" onClick={() => openEditFollower(f)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" aria-label={`Excluir registro de ${dateLabel}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteFollower(f)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-secondary p-3">
                              <div className="flex flex-col">
                                <span className="text-[12px] text-muted-foreground">Início</span>
                                <span className="text-[14px] tabular-nums">{f.followers_start.toLocaleString('pt-BR')}</span>
                              </div>
                              <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                              <div className="flex flex-col items-end">
                                <span className="text-[12px] text-muted-foreground">Fim</span>
                                {isAnalysis ? (
                                  <StatusBadge tone="warning">Análise</StatusBadge>
                                ) : (
                                  <span className="text-[14px] tabular-nums">{f.followers_end.toLocaleString('pt-BR')}</span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between px-1">
                              <span className="text-[13px] text-muted-foreground">Resultado</span>
                              <div className="flex items-center gap-2 tabular-nums">
                                <span className={cn("text-[14px] font-semibold", followerDiffClass(isAnalysis, diff))}>
                                  {isAnalysis ? '--' : (diff > 0 ? `+${diff.toLocaleString('pt-BR')}` : diff.toLocaleString('pt-BR'))}
                                </span>
                                {!isAnalysis && <span className="text-[13px] text-muted-foreground">({pct}%)</span>}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    {/* Larger screens */}
                    <div className="hidden overflow-x-auto md:block">
                      <table className="w-full min-w-[640px]">
                        <thead className="border-b border-border">
                          <tr>
                            <th className={thClass}>Data</th>
                            <th className={thClass}>Início</th>
                            <th className={thClass}>Fim</th>
                            <th className={thClass}>Ganho/perda</th>
                            <th className={thClass}>% de crescimento</th>
                            <th className={cn(thClass, "text-right")}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {followers.map((f) => {
                            const isAnalysis = f.followers_end === 0;
                            const diff = f.followers_end - f.followers_start;
                            const pct = f.followers_start !== 0 ? ((diff / f.followers_start) * 100).toFixed(2) : "0";
                            const dateLabel = formatLocalDate(f.date, 'dd/MM/yyyy');
                            return (
                              <tr key={f.id} className={rowClass}>
                                <td className={cn(tdClass, "tabular-nums text-muted-foreground")}>{dateLabel}</td>
                                <td className={cn(tdClass, "tabular-nums")}>{f.followers_start.toLocaleString()}</td>
                                <td className={tdClass}>
                                  {isAnalysis ? (
                                    <StatusBadge tone="warning">Em análise</StatusBadge>
                                  ) : (
                                    <span className="tabular-nums">{f.followers_end.toLocaleString()}</span>
                                  )}
                                </td>
                                <td className={cn(tdClass, "font-semibold tabular-nums", followerDiffClass(isAnalysis, diff))}>
                                  {isAnalysis ? '--' : (diff > 0 ? `+${diff}` : diff)}
                                </td>
                                <td className={cn(tdClass, "tabular-nums text-muted-foreground")}>{isAnalysis ? '--' : `${pct}%`}</td>
                                <td className={cn(tdClass, "py-1.5 text-right")}>
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" aria-label={`Editar registro de ${dateLabel}`} className="text-muted-foreground hover:text-foreground" onClick={() => openEditFollower(f)}>
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" aria-label={`Excluir registro de ${dateLabel}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteFollower(f)}>
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Panel>
            </TabsContent>

            {/* 3. CONTROLE DE POSTS */}
            <TabsContent value="posts" className="mt-0">
              <Panel
                title="Relatório de postagens"
                description="Publicações importadas, agrupadas por mês"
                actions={
                  <>
                    <Button variant="outline" className="gap-2" onClick={handlePullLatestPost}>
                      <Instagram className="h-4 w-4" aria-hidden="true" /> Puxar posts
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={handleUpdateAllPosts} disabled={isSyncingPosts}>
                      <RefreshCw className={cn("h-4 w-4", isSyncingPosts && "animate-spin")} aria-hidden="true" /> Atualizar todos
                    </Button>
                    <Dialog open={isPostModalOpen} onOpenChange={(open) => {
                      setIsPostModalOpen(open);
                      if (!open) setEditingPostId(null);
                    }}>
                      <DialogTrigger asChild>
                        <Button className="gap-2" onClick={resetNewPost}>
                          <Plus className="h-4 w-4" aria-hidden="true" /> Registrar post
                        </Button>
                      </DialogTrigger>
                      <DialogContent className={dialogScroll} onClickCapture={handleEncerradoCapture}>
                        <DialogHeader>
                          <DialogTitle className="text-[20px]">{editingPostId ? 'Editar post' : 'Registrar publicação'}</DialogTitle>
                          <DialogDescription className="sr-only">Preencha os dados do post</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-2">
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="Data" htmlFor="post-date">
                              <Input id="post-date" type="date" value={postForm.date} onChange={(e) => setPostForm({...postForm, date: e.target.value})} />
                            </Field>
                            <Field label="Tipo" htmlFor="post-type">
                              <Select value={postForm.type} onValueChange={(v) => setPostForm({...postForm, type: v})}>
                                <SelectTrigger id="post-type">
                                  <SelectValue placeholder="Tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="feed">Feed</SelectItem>
                                  <SelectItem value="reels">Reels</SelectItem>
                                  <SelectItem value="story">Story</SelectItem>
                                  <SelectItem value="carrossel">Carrossel</SelectItem>
                                </SelectContent>
                              </Select>
                            </Field>
                          </div>
                          <Field label="Legenda" htmlFor="post-caption">
                            <Textarea
                              id="post-caption"
                              value={postForm.caption}
                              onChange={(e) => setPostForm({...postForm, caption: e.target.value})}
                              placeholder="Escreva a legenda…"
                              className="h-20"
                            />
                          </Field>
                          <div className="grid grid-cols-3 gap-3">
                            <Field label="Alcance" htmlFor="post-reach">
                              <Input id="post-reach" type="number" inputMode="numeric" value={postForm.reach} onChange={(e) => setPostForm({...postForm, reach: Number(e.target.value)})} />
                            </Field>
                            <Field label="Likes" htmlFor="post-likes">
                              <Input id="post-likes" type="number" inputMode="numeric" value={postForm.likes} onChange={(e) => setPostForm({...postForm, likes: Number(e.target.value)})} />
                            </Field>
                            <Field label="Comentários" htmlFor="post-comments">
                              <Input id="post-comments" type="number" inputMode="numeric" value={postForm.comments} onChange={(e) => setPostForm({...postForm, comments: Number(e.target.value)})} />
                            </Field>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <Field label="Link do post (opcional)" htmlFor="post-link">
                              <Input id="post-link" value={postForm.link} onChange={(e) => setPostForm({...postForm, link: e.target.value})} placeholder="https://…" />
                            </Field>
                            <Field label="URL da capa (opcional)" htmlFor="post-image">
                              <Input id="post-image" value={postForm.image_url} onChange={(e) => setPostForm({...postForm, image_url: e.target.value})} placeholder="https://…" />
                            </Field>
                          </div>
                        </div>
                        <DialogFooter className="gap-2">
                          <Button variant="ghost" onClick={() => setIsPostModalOpen(false)}>Cancelar</Button>
                          <Button onClick={async () => {
                            if (isEncerrado()) { setIsPostModalOpen(false); return; }
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
                  </>
                }
              >
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
                    <EmptyState
                      icon={<ImageIcon />}
                      title="Nenhuma publicação importada"
                      description="Sincronize com o Instagram no modal de integrações."
                    />
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
                          <section key={key} aria-label={monthLabel}>
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2">
                              <div className="flex items-center gap-2">
                                <h3 className="text-[15px] font-semibold capitalize text-foreground">{monthLabel}</h3>
                                <StatusBadge>{groupPosts.length} post{groupPosts.length !== 1 ? 's' : ''}</StatusBadge>
                              </div>
                              <div className="flex items-center gap-4 text-[13px] tabular-nums text-muted-foreground">
                                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Likes:</span>{monthTotalLikes.toLocaleString()}</span>
                                <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Comentários:</span>{monthTotalComments.toLocaleString()}</span>
                                {monthTotalReach > 0 && <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden="true" /><span className="sr-only">Alcance:</span>{compact(monthTotalReach)}</span>}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                              {groupPosts.map((post) => (
                                <article key={post.id} className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-background">
                                  <div className="relative aspect-square overflow-hidden bg-muted">
                                    {post.image_url ? (
                                      <img
                                        src={post.image_url}
                                        alt={post.caption ? `Capa do post: ${post.caption.slice(0, 80)}` : 'Capa do post'}
                                        loading="lazy"
                                        className="h-full w-full object-cover"
                                        onError={e => {
                                          const img = e.target as HTMLImageElement;
                                          img.style.display = 'none';
                                          const fallback = img.parentElement?.querySelector('.img-fallback') as HTMLElement;
                                          if (fallback) fallback.style.display = 'flex';
                                        }}
                                      />
                                    ) : null}
                                    <div className={`img-fallback h-full w-full flex-col items-center justify-center p-3 ${post.image_url ? 'hidden' : 'flex'}`}>
                                      <ImageIcon className="mb-1 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                                      {post.caption && (
                                        <p className="line-clamp-3 text-center text-[12px] leading-tight text-muted-foreground">{post.caption}</p>
                                      )}
                                    </div>
                                    {(post.type === 'reels' || post.type === 'carrossel') && (
                                      <span className="absolute left-1.5 top-1.5 z-10 rounded-md bg-background/90 px-1.5 py-0.5 text-[12px] font-medium text-foreground">
                                        {post.type === 'reels' ? 'Reels' : 'Carrossel'}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-start justify-between gap-1 py-1 pl-2.5 pr-0.5">
                                    <div className="min-w-0 pt-1.5">
                                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] tabular-nums text-muted-foreground">
                                        <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" aria-hidden="true" /><span className="sr-only">Likes:</span>{post.likes.toLocaleString()}</span>
                                        <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" aria-hidden="true" /><span className="sr-only">Comentários:</span>{post.comments.toLocaleString()}</span>
                                        {post.reach > 0 && <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" aria-hidden="true" /><span className="sr-only">Alcance:</span>{compact(post.reach)}</span>}
                                      </div>
                                      <p className="mt-0.5 text-[12px] text-muted-foreground">{formatLocalDate(post.date, 'dd MMM')}</p>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground" aria-label="Ações do post">
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem className="cursor-pointer gap-2" onClick={() => openEditPost(post)}>
                                          <Edit2 className="h-4 w-4" aria-hidden="true" /> Editar
                                        </DropdownMenuItem>
                                        {post.post_link && (
                                          <DropdownMenuItem asChild className="cursor-pointer gap-2">
                                            <a href={post.post_link} target="_blank" rel="noreferrer">
                                              <ExternalLink className="h-4 w-4" aria-hidden="true" /> Abrir no Instagram
                                            </a>
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem className="cursor-pointer gap-2 text-destructive focus:text-destructive" onClick={() => removePost(post)}>
                                          <Trash2 className="h-4 w-4" aria-hidden="true" /> Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </article>
                              ))}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  );
                })()}
              </Panel>

              {/* Dialog to pull/import Instagram posts */}
              <Dialog open={isPullModalOpen} onOpenChange={setIsPullModalOpen}>
                <DialogContent className="flex h-[85vh] max-w-6xl flex-col gap-0 p-0 sm:max-w-6xl sm:p-0" onClickCapture={handleEncerradoCapture}>
                  <DialogHeader className="flex flex-row items-start justify-between gap-3 space-y-0 border-b border-border px-5 py-4 pr-14 text-left">
                    <div className="min-w-0">
                      <DialogTitle className="text-[20px]">Importar publicações do Instagram</DialogTitle>
                      <DialogDescription className="mt-1 text-[14px]">
                        Selecione quais posts do perfil de {client.username} você deseja registrar.
                      </DialogDescription>
                    </div>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleLoadScrappaPosts}
                      disabled={isFetchingScrappa}
                      aria-label="Recarregar publicações"
                      className="shrink-0"
                    >
                      <RefreshCw className={cn("h-4 w-4", isFetchingScrappa && "animate-spin")} />
                    </Button>
                  </DialogHeader>

                  <div className="flex-1 overflow-y-auto p-5">
                    {isFetchingScrappa ? (
                      <LoadingBlock label="Buscando publicações recentes…" />
                    ) : scrappaPosts.length === 0 ? (
                      <EmptyState
                        icon={<ImageIcon />}
                        title="Nenhum post recente encontrado"
                        description={`Verifique se o @${client.username} está correto e público no Instagram.`}
                      />
                    ) : (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {scrappaPosts.map((post: any, idx: number) => {
                          const isImported = isPostAlreadyImported(post);
                          const permalink = post.permalink || (post.shortcode ? `https://www.instagram.com/p/${post.shortcode}/` : post.post_link || "");
                          const isVideo = post.is_video || post.video_url || post.product_type === 'clips' || post.media_type === 'video';
                          const imageUrl = post.media?.[0]?.thumbnail_url || post.media?.[0]?.images?.[0]?.url || post.thumbnail_url || post.display_url || "";

                          // Metrics (using centralized helpers for robust field extraction)
                          const likes = getPostLikes(post);
                          const comments = getPostComments(post);
                          const apiReach = getPostReach(post);
                          const postKey = post.shortcode || post.id || permalink;
                          const reach = reachOverrides[postKey] !== undefined ? reachOverrides[postKey] : apiReach;
                          const selected = selectedScrappaPosts.has(postKey);
                          const caption = post.caption || post.text || 'Sem legenda';

                          return (
                            <div
                              key={post.id || idx}
                              role="checkbox"
                              aria-checked={selected}
                              aria-label={`Selecionar post: ${caption.slice(0, 60)}`}
                              tabIndex={0}
                              className={cn(
                                "relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                selected ? "border-primary ring-1 ring-primary" : "border-border hover:border-input"
                              )}
                              onClick={(e) => {
                                // Don't toggle if clicking on the reach input or buttons
                                if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'BUTTON' || (e.target as HTMLElement).closest('button')) return;
                                togglePostSelection(postKey);
                              }}
                              onKeyDown={(e) => {
                                if (e.target !== e.currentTarget) return;
                                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); togglePostSelection(postKey); }
                              }}
                            >
                              {/* Selection indicator */}
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute right-2.5 top-2.5 z-10 grid h-5 w-5 place-items-center rounded border transition-colors duration-150",
                                  selected ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background/90"
                                )}
                              >
                                {selected && <Check className="h-3.5 w-3.5" />}
                              </span>
                              <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-background/90 px-1.5 py-0.5 text-[12px] font-medium text-foreground">
                                {isVideo ? 'Reels' : 'Feed'}
                              </span>
                              <div className="relative h-44 w-full overflow-hidden bg-muted">
                                {imageUrl ? (
                                  <img src={imageUrl} alt="Capa do post" loading="lazy" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <ImageIcon className="h-8 w-8" aria-hidden="true" />
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-1 flex-col gap-3 p-3">
                                <p className="text-[12px] text-muted-foreground">
                                  {post.taken_at || post.timestamp ? formatLocalDate(post.taken_at || post.timestamp, 'dd MMM yyyy') : '-'}
                                </p>
                                <p className="line-clamp-2 text-[13px] text-foreground">"{caption}"</p>
                                <dl className="grid grid-cols-3 gap-1 rounded-lg bg-secondary py-1.5 text-center">
                                  <div>
                                    <dt className="text-[12px] text-muted-foreground">Likes</dt>
                                    <dd className="text-[13px] font-semibold tabular-nums">{likes.toLocaleString()}</dd>
                                  </div>
                                  <div>
                                    <dt className="text-[12px] text-muted-foreground">Coment.</dt>
                                    <dd className="text-[13px] font-semibold tabular-nums">{comments.toLocaleString()}</dd>
                                  </div>
                                  <div className="px-1">
                                    <dt className="text-[12px] text-muted-foreground">Views</dt>
                                    <dd>
                                      {apiReach === 0 && !isImported ? (
                                        <input
                                          type="number"
                                          inputMode="numeric"
                                          placeholder="0"
                                          aria-label="Views do Instagram Insights"
                                          value={reachOverrides[postKey] || ''}
                                          onChange={(e) => setReachOverrides(prev => ({
                                            ...prev,
                                            [postKey]: Number(e.target.value) || 0
                                          }))}
                                          className="h-7 w-full rounded-md border border-input bg-background px-1 text-center text-[13px] font-semibold tabular-nums text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                          title="Insira o alcance do Instagram Insights"
                                        />
                                      ) : (
                                        <span className="text-[13px] font-semibold tabular-nums">{reach.toLocaleString()}</span>
                                      )}
                                    </dd>
                                  </div>
                                </dl>
                                <div className="mt-auto">
                                  {isImported ? (
                                    <div className="flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-[hsl(var(--admin-success)/0.15)] text-[13px] font-medium text-[hsl(var(--admin-success))]">
                                      <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Já importado
                                    </div>
                                  ) : (
                                    <div className={cn(
                                      "flex h-9 w-full items-center justify-center gap-1.5 rounded-md text-[13px] font-medium transition-colors duration-150",
                                      selected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                                    )}>
                                      {selected ? (<><CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Selecionado</>) : 'Clique para selecionar'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: selection controls */}
                    <div className="flex flex-wrap items-center gap-2 text-[13px]">
                      {scrappaPosts.length > 0 && (
                        <>
                          <span className="tabular-nums text-muted-foreground">
                            {selectedScrappaPosts.size} de {scrappaPosts.filter(p => !isPostAlreadyImported(p)).length} selecionado{selectedScrappaPosts.size !== 1 ? 's' : ''}
                          </span>
                          <Button size="sm" variant="ghost" onClick={handleSelectAllNotImported}>Selecionar todos</Button>
                          {selectedScrappaPosts.size > 0 && (
                            <Button size="sm" variant="ghost" onClick={handleDeselectAll}>Desmarcar</Button>
                          )}
                        </>
                      )}
                    </div>
                    {/* Right: action buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      {selectedScrappaPosts.size > 0 && (
                        <>
                          {/* Show remove button if any selected post is already imported */}
                          {Array.from(selectedScrappaPosts).some(key =>
                            posts.some(p => (p.post_link || '').toLowerCase().includes(key))
                          ) && (
                            <Button variant="destructive" onClick={handleBatchRemove} disabled={isBatchRemoving} className="gap-2">
                              {isBatchRemoving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
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
                              <Button onClick={handleBatchImport} disabled={isBatchImporting} className="gap-2">
                                {isBatchImporting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                                Importar selecionados ({importableCount})
                              </Button>
                            ) : null;
                          })()}
                        </>
                      )}
                      <Button variant="secondary" onClick={() => { setIsPullModalOpen(false); setSelectedScrappaPosts(new Set()); }}>
                        Fechar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* 4. CONTRATO */}
            <TabsContent value="contract" className="mt-0">
              <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
                <div className="min-w-0 space-y-6">
                  <Panel
                    title="Gestão de contrato"
                    description="Registre o valor combinado, cronograma de parcelas, formas de pagamento e fotos do contrato."
                    actions={
                      <>
                        <StatusBadge tone={isContractLocked ? 'danger' : 'success'}>
                          {isContractLocked ? "Contrato travado" : "Contrato liberado"}
                        </StatusBadge>
                        <Button
                          onClick={handleToggleContractLock}
                          title={isContractLocked ? "Destravar contrato" : "Travar contrato"}
                          aria-label={isContractLocked ? "Destravar contrato" : "Travar contrato"}
                          variant="outline"
                          size="icon"
                        >
                          {isContractLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                        <Button onClick={handleSaveContract} disabled={isContractLocked}>
                          Salvar contrato
                        </Button>
                      </>
                    }
                  >
                    <p className="mb-5 text-[13px] text-muted-foreground">
                      {isContractLocked ? "Destrave para editar." : "Bloqueie para travar as alterações."}
                    </p>

                    {/* Summary */}
                    <div className="mb-6 border-b border-border pb-6">
                      <p className="text-[13px] text-muted-foreground">Resumo do contrato</p>
                      <p className="mt-0.5 text-[20px] font-semibold text-foreground">{contractForm.contract_type || 'Sem tipo definido'}</p>
                      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
                        <Metric label="Valor combinado" value={<span className="text-[17px]">{brl(contractForm.contract_value || 0)}</span>} />
                        <Metric label="Frequência" value={<span className="text-[17px] capitalize">{contractForm.contract_frequency}</span>} />
                        <Metric label="Forma" value={<span className="text-[17px]">{contractForm.contract_payment_method || 'Não definido'}</span>} />
                        <Metric label="Parcelas" value={<span className="text-[17px]">{contractForm.contract_installments || 1} x {brl(installmentValue)}</span>} />
                      </dl>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-4 py-3">
                        <div>
                          <p className="text-[13px] text-muted-foreground">Próximo pagamento</p>
                          <p className="text-[15px] font-semibold text-foreground">{nextPaymentCountdown || 'Defina data e parcelas'}</p>
                        </div>
                        {nextPaymentDue && (
                          <p className="text-[14px] tabular-nums text-muted-foreground">{formatLocalDate(nextPaymentDue.date.toISOString(), 'dd MMM yyyy')}</p>
                        )}
                      </div>
                    </div>

                    {/* Form */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Tipo de contrato" htmlFor="contract-type">
                        <Input
                          id="contract-type"
                          disabled={isContractLocked}
                          value={contractForm.contract_type}
                          onChange={(e) => setContractForm({ ...contractForm, contract_type: e.target.value })}
                          placeholder="Ex: Tilápia / Semana"
                        />
                      </Field>
                      <Field label="Valor combinado" htmlFor="contract-value">
                        <Input
                          id="contract-value"
                          disabled={isContractLocked}
                          type="number"
                          inputMode="decimal"
                          value={contractForm.contract_value}
                          onChange={(e) => setContractForm({ ...contractForm, contract_value: Number(e.target.value) })}
                          placeholder="0.00"
                        />
                      </Field>
                      <Field label="Frequência de pagamento" htmlFor="contract-frequency">
                        <Select value={contractForm.contract_frequency} onValueChange={(v) => setContractForm({ ...contractForm, contract_frequency: v as any })}>
                          <SelectTrigger id="contract-frequency" disabled={isContractLocked}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="único">Único</SelectItem>
                            <SelectItem value="semanal">Semanal</SelectItem>
                            <SelectItem value="quinzenal">Quinzenal</SelectItem>
                            <SelectItem value="mensal">Mensal</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Método de pagamento" htmlFor="contract-method">
                        <Select value={contractForm.contract_payment_method} onValueChange={(v) => setContractForm({ ...contractForm, contract_payment_method: v })}>
                          <SelectTrigger id="contract-method" disabled={isContractLocked}>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Transferência">Transferência</SelectItem>
                            <SelectItem value="Boleto">Boleto</SelectItem>
                            <SelectItem value="Cartão">Cartão</SelectItem>
                            <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Canais de pagamento" htmlFor="contract-channels">
                        <Input
                          id="contract-channels"
                          disabled={isContractLocked}
                          value={contractForm.contract_payment_channels}
                          onChange={(e) => setContractForm({ ...contractForm, contract_payment_channels: e.target.value })}
                          placeholder="PIX, Transferência, Cartão…"
                        />
                      </Field>
                      <Field label="Número de parcelas" htmlFor="contract-installments">
                        <Input
                          id="contract-installments"
                          disabled={isContractLocked}
                          type="number"
                          inputMode="numeric"
                          min={1}
                          value={contractForm.contract_installments}
                          onChange={(e) => setContractForm({ ...contractForm, contract_installments: Number(e.target.value) || 1 })}
                        />
                      </Field>
                      <Field label="Valor da parcela" htmlFor="contract-installment-value">
                        <Input
                          id="contract-installment-value"
                          disabled={isContractLocked}
                          type="number"
                          inputMode="decimal"
                          value={contractForm.contract_installment_value || getComputedInstallmentValue()}
                          onChange={(e) => setContractForm({ ...contractForm, contract_installment_value: Number(e.target.value) })}
                        />
                      </Field>
                      <Field label="Data de início / vencimento" htmlFor="contract-due-start">
                        <Input
                          id="contract-due-start"
                          disabled={isContractLocked}
                          type="date"
                          value={contractForm.contract_due_start}
                          onChange={(e) => setContractForm({ ...contractForm, contract_due_start: e.target.value })}
                        />
                      </Field>
                      <Field label="Observações do contrato" htmlFor="contract-notes" className="md:col-span-2">
                        <Textarea
                          id="contract-notes"
                          disabled={isContractLocked}
                          value={contractForm.contract_notes}
                          onChange={(e) => setContractForm({ ...contractForm, contract_notes: e.target.value })}
                          className="h-28"
                        />
                      </Field>
                    </div>
                  </Panel>

                  <Panel
                    title="Cronograma de parcelas"
                    description={nextPaymentCountdown ? `Próximo vencimento: ${nextPaymentCountdown}` : 'Defina data e parcelas para ver o próximo vencimento'}
                    bodyClassName="p-0"
                  >
                    {contractSchedule.length === 0 ? (
                      <div className="p-5">
                        <EmptyState icon={<Calendar />} title="Nenhuma parcela prevista" description="Defina o valor e a data para ver as parcelas." className="py-10" />
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[480px]">
                          <thead className="border-b border-border">
                            <tr>
                              <th className={thClass}>Parcela</th>
                              <th className={thClass}>Vencimento</th>
                              <th className={thClass}>Valor</th>
                              <th className={thClass}>Situação</th>
                            </tr>
                          </thead>
                          <tbody>
                            {contractSchedule.slice(0, 6).map((item) => {
                              const isNext = nextPaymentDue?.index === item.index;
                              const isPast = item.date < todayOnly;
                              return (
                                <tr key={item.index} className={cn(rowClass, isNext && "bg-secondary hover:bg-secondary")} aria-current={isNext ? "true" : undefined}>
                                  <td className={cn(tdClass, "font-medium")}>Parcela {item.index}</td>
                                  <td className={cn(tdClass, "tabular-nums text-muted-foreground")}>{formatLocalDate(item.date.toISOString(), 'dd MMM yyyy')}</td>
                                  <td className={cn(tdClass, "tabular-nums")}>{brl(installmentValue)}</td>
                                  <td className={tdClass}>
                                    {isNext ? (
                                      <StatusBadge tone="info">Próximo</StatusBadge>
                                    ) : isPast ? (
                                      <StatusBadge>Anterior</StatusBadge>
                                    ) : (
                                      <span className="text-[13px] text-muted-foreground">Prevista</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Panel>
                </div>

                <div className="min-w-0">
                  <Panel title="Fotos do contrato" description="Imagens do contrato assinado">
                    <Field label="Enviar fotos" htmlFor="contract-photos" hint={isContractLocked ? "Destrave o contrato para enviar fotos." : undefined}>
                      <input
                        id="contract-photos"
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={isContractLocked}
                        onChange={handleContractFileUpload}
                        className="w-full rounded-lg border border-input bg-background text-[13px] text-muted-foreground file:mr-3 file:h-10 file:cursor-pointer file:border-0 file:border-r file:border-input file:bg-secondary file:px-4 file:text-[14px] file:font-medium file:text-foreground hover:file:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    </Field>
                    {isContractUploading && (
                      <p role="status" className="mt-2 flex items-center gap-2 text-[13px] text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Enviando fotos…
                      </p>
                    )}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {contractForm.contract_photos?.map((photo, i) => (
                        <div key={photo} className="relative overflow-hidden rounded-lg border border-border bg-muted">
                          <button
                            type="button"
                            onClick={() => setSelectedContractPhoto(photo)}
                            aria-label={`Ampliar foto ${i + 1} do contrato`}
                            className="block h-40 w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                          >
                            <img src={photo} alt={`Foto ${i + 1} do contrato`} className="h-full w-full object-cover" />
                          </button>
                          {!isContractLocked && (
                            <Button
                              type="button"
                              size="icon"
                              variant="secondary"
                              onClick={() => handleRemoveContractPhoto(photo)}
                              aria-label={`Remover foto ${i + 1} do contrato`}
                              className="absolute right-2 top-2 rounded-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      {(!contractForm.contract_photos || contractForm.contract_photos.length === 0) && (
                        <EmptyState icon={<Camera />} title="Nenhuma foto adicionada ainda." className="col-span-full py-10" />
                      )}
                    </div>
                  </Panel>

                  <Dialog open={Boolean(selectedContractPhoto)} onOpenChange={(open) => { if (!open) setSelectedContractPhoto(null); }}>
                    <DialogContent className="max-w-5xl gap-0 overflow-hidden p-0 sm:max-w-5xl sm:p-0" onClickCapture={handleEncerradoCapture}>
                      <DialogTitle className="sr-only">Foto do contrato</DialogTitle>
                      <DialogDescription className="sr-only">Visualização ampliada da foto do contrato</DialogDescription>
                      <div className="bg-background">
                        {selectedContractPhoto && (
                          <img src={selectedContractPhoto} alt="Contrato em tela grande" className="h-[75vh] w-full bg-background object-contain" />
                        )}
                      </div>
                      <div className="flex justify-end border-t border-border p-4">
                        <Button variant="secondary" onClick={() => setSelectedContractPhoto(null)}>Fechar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </TabsContent>

            {/* 5. FINANCEIRO */}
            <TabsContent value="finance" className="mt-0 space-y-6">
              <section aria-label="Resumo financeiro" className="rounded-xl border border-border bg-card p-5">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4">
                  <Metric label="Faturamento total" value={brl(financialStats.totalPaid)} />
                  <Metric label="Mensalidade" value={brl(client.monthly_value)} />
                  <Metric
                    label="Pendências"
                    value={
                      <span className={financialStats.pendingCount > 0 ? 'text-[hsl(var(--admin-warning))]' : 'text-[hsl(var(--admin-success))]'}>
                        {financialStats.pendingCount}
                      </span>
                    }
                  />
                  <Metric label="Meta anual" value={brl(client.monthly_value * 12)} />
                </dl>
              </section>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <Panel
                  className="min-w-0 lg:col-span-2"
                  title="Desempenho financeiro"
                  description="Faturamento mensal"
                  actions={<StatusBadge tone="success">Alta</StatusBadge>}
                >
                  {payments.length === 0 ? (
                    <EmptyState icon={<Receipt />} title="Sem pagamentos para exibir" description="Registre um pagamento para ver o gráfico." className="py-10" />
                  ) : (
                    <div className="h-[220px] w-full md:h-[260px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                          data={payments.slice().reverse().map(p => ({
                            name: formatLocalDate(p.date, 'MMM/yy'),
                            amount: Number(p.amount)
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
                          <XAxis dataKey="name" {...CHART_AXIS} axisLine={false} />
                          <YAxis {...CHART_AXIS} axisLine={false} tickFormatter={(v) => `R$${v}`} width={56} />
                          <Tooltip {...CHART_TOOLTIP} formatter={(v: number) => [brl(v), 'Valor']} />
                          <Area type="monotone" dataKey="amount" stroke="hsl(var(--foreground))" strokeWidth={2} fill="hsl(var(--foreground))" fillOpacity={0.06} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </Panel>

                <Panel title="Indicadores">
                  <dl className="space-y-5">
                    <Metric
                      label="Ticket médio"
                      value={brl(payments.length > 0 ? (financialStats.totalPaid / payments.length) : 0)}
                      hint={`Base de ${payments.length} meses`}
                    />
                    <div>
                      <dt className="text-[13px] text-muted-foreground">Status geral</dt>
                      <dd className="mt-1.5"><StatusBadge tone="success">Saúde excelente</StatusBadge></dd>
                    </div>
                  </dl>
                </Panel>
              </div>

              <Panel
                title="Centro administrativo"
                description="Gestão de faturamento e histórico de pagamentos"
                bodyClassName="p-0"
                actions={
                  <>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        const message = encodeURIComponent(`Olá ${client.name}! Lembrete de pagamento R$ ${client.monthly_value}.`);
                        window.open(`https://wa.me/55?text=${message}`, '_blank');
                      }}
                    >
                      <Send className="h-4 w-4" aria-hidden="true" /> WhatsApp
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => { setPaymentForm({ date: new Date().toISOString().split('T')[0], amount: client.monthly_value, status: 'pending' }); setIsPaymentModalOpen(true); }}
                    >
                      <AlertCircle className="h-4 w-4" aria-hidden="true" /> Pendência
                    </Button>
                    <Button
                      onClick={() => { setEditingPaymentId(null); setPaymentForm({ date: new Date().toISOString().split('T')[0], amount: client.monthly_value, status: 'paid' }); setIsPaymentModalOpen(true); }}
                    >
                      Registrar pagamento
                    </Button>
                  </>
                }
              >
                {payments.length === 0 ? (
                  <div className="p-5">
                    <EmptyState icon={<Receipt />} title="Nenhum pagamento registrado" description="Use Registrar pagamento para lançar a primeira entrada." />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead className="border-b border-border">
                        <tr>
                          <th className={thClass}>Mês de referência</th>
                          <th className={thClass}>Valor</th>
                          <th className={thClass}>Status</th>
                          <th className={cn(thClass, "text-right")}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => {
                          const monthLabel = formatLocalDate(p.date, 'MMMM yyyy');
                          return (
                            <tr key={p.id} className={rowClass}>
                              <td className={cn(tdClass, "font-medium capitalize")}>{monthLabel}</td>
                              <td className={cn(tdClass, "font-semibold tabular-nums")}>{brl(p.amount)}</td>
                              <td className={tdClass}>
                                <StatusBadge tone={p.status === 'paid' ? 'success' : 'warning'}>
                                  {p.status === 'paid' ? 'Liquidado' : 'Aguardando'}
                                </StatusBadge>
                              </td>
                              <td className={cn(tdClass, "py-1.5 text-right")}>
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" aria-label={`Editar pagamento de ${monthLabel}`} className="text-muted-foreground hover:text-foreground" onClick={() => openEditPayment(p)}>
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" aria-label={`Excluir pagamento de ${monthLabel}`} className="text-muted-foreground hover:text-destructive" onClick={() => removePayment(p)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </Panel>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Panel
                  title="Controle de custos"
                  description="Despesas operacionais"
                  actions={
                    <Button variant="outline" className="gap-2" onClick={() => setIsExpenseModalOpen(true)}>
                      <Plus className="h-4 w-4" aria-hidden="true" /> Novo gasto
                    </Button>
                  }
                >
                  {expenses.length === 0 ? (
                    <EmptyState icon={<ArrowDownRight />} title="Sem despesas registradas" className="py-10" />
                  ) : (
                    <ul className="divide-y divide-border">
                      {expenses.map(exp => (
                        <li key={exp.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-destructive/15 text-destructive">
                              <ArrowDownRight className="h-4 w-4" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[14px] font-medium text-foreground">{exp.description}</p>
                              <p className="text-[13px] tabular-nums text-muted-foreground">{formatLocalDate(exp.date, 'dd MMM yyyy')}</p>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <p className="text-[14px] font-semibold tabular-nums text-destructive">-{brl(exp.amount)}</p>
                            <Button variant="ghost" size="icon" aria-label={`Remover gasto ${exp.description}`} className="text-muted-foreground hover:text-destructive" onClick={() => setExpenses(expenses.filter(e => e.id !== exp.id))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Panel>

                <Panel title="Rentabilidade real" description="Margem líquida estimada">
                  <div className="h-48 w-full md:h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={[
                          { name: 'Lucro', value: Math.max(0, financialStats.totalPaid - totalExpenses) },
                          { name: 'Custo', value: totalExpenses }
                        ]} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                          <Cell fill="hsl(var(--admin-success))" />
                          <Cell fill="hsl(var(--destructive))" />
                        </Pie>
                        <Tooltip {...CHART_TOOLTIP} formatter={(v: number, name: string) => [brl(v), name]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-5 text-[13px] text-muted-foreground">
                    <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-[hsl(var(--admin-success))]" />Lucro</span>
                    <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-destructive" />Custo</span>
                  </div>
                  <div className="mt-4 rounded-lg bg-secondary p-4 text-center">
                    <p className="text-[13px] text-muted-foreground">Lucro líquido</p>
                    <p className="mt-1 text-[24px] font-semibold tabular-nums text-foreground">
                      {brl(financialStats.totalPaid - totalExpenses)}
                    </p>
                  </div>
                </Panel>
              </div>
            </TabsContent>

            {/* 6. TAREFAS */}
            <TabsContent value="tasks" className="mt-0">
              <Panel
                title="Planner interno"
                description={tasks.length > 0 ? `${openTasks} em aberto de ${tasks.length}` : 'Tarefas, ideias e pautas deste cliente'}
                actions={
                  <Dialog open={isTaskModalOpen} onOpenChange={(open) => {
                    setIsTaskModalOpen(open);
                    if (!open) setEditingTaskId(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button className="gap-2" onClick={resetNewTask}>
                        <Plus className="h-4 w-4" aria-hidden="true" /> Nova tarefa
                      </Button>
                    </DialogTrigger>
                    <DialogContent className={dialogScroll} onClickCapture={handleEncerradoCapture}>
                      <DialogHeader>
                        <DialogTitle className="text-[20px]">{editingTaskId ? 'Editar tarefa / ideia' : 'Adicionar tarefa / ideia'}</DialogTitle>
                        <DialogDescription className="sr-only">Adicione uma nova tarefa ou ideia ao planner</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-2">
                        <Field label="Título" htmlFor="task-title">
                          <Input
                            id="task-title"
                            value={taskForm.title}
                            onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                            placeholder="Ex: Pesquisa de referências"
                          />
                        </Field>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <Field label="Prioridade" htmlFor="task-priority">
                            <Select value={taskForm.priority} onValueChange={(v) => setTaskForm({...taskForm, priority: v})}>
                              <SelectTrigger id="task-priority">
                                <SelectValue placeholder="Prioridade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="baixa">Baixa</SelectItem>
                                <SelectItem value="média">Média</SelectItem>
                                <SelectItem value="alta">Alta</SelectItem>
                                <SelectItem value="urgente">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                          <Field label="Tipo" htmlFor="task-type">
                            <Select value={taskForm.type} onValueChange={(v) => setTaskForm({...taskForm, type: v})}>
                              <SelectTrigger id="task-type">
                                <SelectValue placeholder="Tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="task">Tarefa</SelectItem>
                                <SelectItem value="idea">Ideia</SelectItem>
                                <SelectItem value="pauta">Pauta</SelectItem>
                                <SelectItem value="checklist">Checklist</SelectItem>
                              </SelectContent>
                            </Select>
                          </Field>
                        </div>
                        <Field label="Prazo" htmlFor="task-due">
                          <Input
                            id="task-due"
                            type="date"
                            value={taskForm.due_date}
                            onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                          />
                        </Field>
                      </div>
                      <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsTaskModalOpen(false)}>Cancelar</Button>
                        <Button onClick={async () => {
                          if (isEncerrado()) { setIsTaskModalOpen(false); return; }
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
                        }}>{editingTaskId ? 'Salvar' : 'Adicionar'}</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                }
              >
                {tasks.length === 0 ? (
                  <EmptyState
                    icon={<ListTodo />}
                    title="Nenhuma tarefa ainda"
                    description="Anote tarefas, ideias e pautas para este cliente."
                    action={
                      <Button variant="outline" className="gap-2" onClick={() => { resetNewTask(); setIsTaskModalOpen(true); }}>
                        <Plus className="h-4 w-4" aria-hidden="true" /> Nova tarefa
                      </Button>
                    }
                  />
                ) : (
                  <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className={cn(
                          "flex flex-col gap-3 rounded-lg border border-border bg-background p-3 transition-colors duration-150 hover:border-input",
                          task.completed && "opacity-60"
                        )}
                      >
                        <div className="flex items-start gap-1">
                          <button
                            type="button"
                            aria-label={task.completed ? `Marcar "${task.title}" como pendente` : `Marcar "${task.title}" como concluída`}
                            aria-pressed={task.completed}
                            onClick={async () => {
                              if (isEncerrado()) return;
                              await updateInstagramTask(task.id, { completed: !task.completed });
                              loadData(id!);
                            }}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-colors duration-150 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <span className={cn(
                              "grid h-5 w-5 place-items-center rounded-md border transition-colors duration-150",
                              task.completed ? "border-primary bg-primary text-primary-foreground" : "border-input"
                            )}>
                              {task.completed && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                            </span>
                          </button>
                          <div className="min-w-0 flex-1 cursor-pointer pt-2" onClick={() => openEditTask(task)}>
                            <p className={cn("break-words text-[15px] font-medium text-foreground", task.completed && "text-muted-foreground line-through")}>
                              {task.title}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                              {task.due_date ? formatLocalDate(task.due_date, 'dd MMM') : 'Sem prazo'}
                            </p>
                          </div>
                          <div className="flex shrink-0">
                            <Button variant="ghost" size="icon" aria-label={`Editar tarefa ${task.title}`} className="text-muted-foreground hover:text-foreground" onClick={() => openEditTask(task)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Excluir tarefa ${task.title}`}
                              className="text-muted-foreground hover:text-destructive"
                              onClick={async () => {
                                if (isEncerrado()) return;
                                if (confirm("Deseja excluir esta tarefa?")) {
                                  await deleteInstagramTask(task.id);
                                  loadData(id!);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pl-11">
                          <StatusBadge>{TASK_TYPE_LABEL[task.type] || task.type}</StatusBadge>
                          <StatusBadge tone={PRIORITY_TONE[task.priority] || 'neutral'}>{capitalize(task.priority)}</StatusBadge>
                          {task.completed && <StatusBadge tone="success">Concluída</StatusBadge>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </TabsContent>
          </FlyTabs>
        </AdminPage>
      </div>

      {/* --- FINANCE MODALS --- */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className={dialogScroll} onClickCapture={handleEncerradoCapture}>
          <DialogHeader>
            <DialogTitle className="text-[20px]">{editingPaymentId ? 'Editar pagamento' : 'Registrar novo pagamento'}</DialogTitle>
            <DialogDescription className="text-[14px]">Gerencie as entradas financeiras deste cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Data" htmlFor="payment-date">
                <Input id="payment-date" type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})} />
              </Field>
              <Field label="Valor" htmlFor="payment-amount">
                <Input id="payment-amount" type="number" inputMode="decimal" value={paymentForm.amount || ""} onChange={(e) => setPaymentForm({...paymentForm, amount: Number(e.target.value)})} />
              </Field>
            </div>
            <Field label="Status" htmlFor="payment-status">
              <Select value={paymentForm.status} onValueChange={(v) => setPaymentForm({...paymentForm, status: v})}>
                <SelectTrigger id="payment-status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Confirmado / liquidado</SelectItem>
                  <SelectItem value="pending">Aguardando pagamento</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Cancelar</Button>
            <Button onClick={async () => {
              if (isEncerrado()) { setIsPaymentModalOpen(false); return; }
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
        <DialogContent className={dialogScroll} onClickCapture={handleEncerradoCapture}>
          <DialogHeader>
            <DialogTitle className="text-[20px]">Registrar novo gasto</DialogTitle>
            <DialogDescription className="text-[14px]">Custos operacionais (tráfego, design, ferramentas).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Descrição" htmlFor="expense-description">
              <Input id="expense-description" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} placeholder="Ex: Campanha de tráfego" />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Valor" htmlFor="expense-amount">
                <Input id="expense-amount" type="number" inputMode="decimal" value={expenseForm.amount || ""} onChange={(e) => setExpenseForm({...expenseForm, amount: Number(e.target.value)})} />
              </Field>
              <Field label="Data" htmlFor="expense-date">
                <Input id="expense-date" type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} />
              </Field>
            </div>
            <Field label="Categoria" htmlFor="expense-category">
              <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({...expenseForm, category: v})}>
                <SelectTrigger id="expense-category">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produção">Produção</SelectItem>
                  <SelectItem value="tráfego">Tráfego pago</SelectItem>
                  <SelectItem value="ferramentas">Ferramentas / SaaS</SelectItem>
                  <SelectItem value="extra">Extras / bônus</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setIsExpenseModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddExpense}>Confirmar gasto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Encerrado Alert Dialog */}
      <Dialog open={showEncerradoAlert} onOpenChange={setShowEncerradoAlert}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-destructive/15 text-destructive">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
              </span>
              Contrato encerrado
            </DialogTitle>
            <DialogDescription className="mt-2 text-[14px]">
              O contrato de <strong className="font-medium text-foreground">{encerradoAlertAction}</strong> foi encerrado.
              Reative o contrato para fazer alterações.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="w-full" onClick={() => setShowEncerradoAlert(false)}>Entendi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminInstagramClient;
