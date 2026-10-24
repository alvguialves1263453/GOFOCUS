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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Instagram,
  Users,
  Heart,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  Activity,
  Calendar,
  Grid3X3,
  BarChart3,
  User,
  X,
  Clock,
} from "lucide-react";
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
import {
  getInstagramClients,
  createInstagramClient,
  updateInstagramClient,
  addFollowerEntry,
  addInstagramPost,
  getFollowerHistory,
  getInstagramPosts,
  InstagramClient,
  fetchScrappaProfile,
  fetchScrappaPosts,
} from '@/lib/instagram';
import { EmptyState, Field, SectionLabel, StatusBadge } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

/* Chart styling from admin tokens (status/info colour for the data, neutrals for the frame). */
const CHART_TICK = { fill: 'hsl(var(--muted-foreground))', fontSize: 12 };
const CHART_GRID = 'hsl(var(--border))';
const CHART_TOOLTIP = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '10px',
  fontSize: '13px',
  color: 'hsl(var(--foreground))',
};

function Avatar({ src, alt, className }: { src?: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative grid flex-shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary", className)}>
      <User className="h-1/3 w-1/3 text-muted-foreground" aria-hidden="true" />
      {src && (
        <img
          src={src}
          alt={alt}
          className="absolute inset-0 h-full w-full object-cover"
          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      )}
    </div>
  );
}

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
  profile_pic_url?: string;
  profile_picture_url?: string;
  avatar?: string;
  follower_count: number;
  following_count: number;
  media_count: number;
  is_private: boolean;
  is_verified: boolean;
  external_url?: string;
  recent_posts?: any[];
}


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
      const data = await fetchScrappaProfile(cleanUsername, true);
      
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

      const profilePictureUrl = userData.profile_pic_url_hd || userData.profile_pic_url || userData.profile_picture_url || userData.avatar || "";

      if (!client) {
        // Create new client
        client = await createInstagramClient({
          name: userData.full_name || userData.username,
          username: `@${userData.username}`,
          profile_picture: profilePictureUrl,
          niche: "Instagram Import",
          monthly_value: importMonthlyValue,
          payment_day: importPaymentDay,
          status: 'ativo',
          notes: userData.biography,
          start_date: new Date().toISOString().split('T')[0]
        });
        toast.success(`Cliente @${userData.username} criado no sistema!`);
      } else {
        // Update existing client with Instagram profile picture and metadata
        await updateInstagramClient(client.id, {
          profile_picture: profilePictureUrl || client.profile_picture,
          name: userData.full_name || client.name,
          notes: userData.biography || client.notes,
        });
        toast.success(`Cliente @${userData.username} atualizado com foto de perfil!`);
      }

      // 2. Add follower history for today (safeguard values)
      const validFollowers = Number(userData.follower_count) || 0;
      const todayStr = new Date().toISOString().split('T')[0];
      
      const history = await getFollowerHistory(client.id);
      const todayEntry = history.find(h => h.date.split('T')[0] === todayStr);

      if (todayEntry) {
        await addFollowerEntry({
          client_id: client.id,
          date: todayStr,
          followers_start: todayEntry.followers_start,
          followers_end: validFollowers
        });
      } else {
        const lastEntry = history[0];
        const startCount = lastEntry ? lastEntry.followers_end || lastEntry.followers_start : validFollowers;
        await addFollowerEntry({
          client_id: client.id,
          date: todayStr,
          followers_start: startCount,
          followers_end: validFollowers
        });
      }

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
              reach: post.play_count || post.view_count || post.video_view_count || post.video_play_count || post.fb_play_count || post.ig_play_count || post.views || post.video_views || post.reach || post.impressions || post.metrics?.views || post.metrics?.reach || post.metrics?.plays || post.media?.[0]?.play_count || post.media?.[0]?.view_count || 0,
              likes: post.like_count || post.likes_count || post.likes || post.metrics?.likes || 0,
              comments: post.comment_count || post.comments_count || post.comments || post.metrics?.comments || 0,
              shares: post.share_count || post.metrics?.shares || 0,
              saves: post.save_count || post.metrics?.saves || 0,
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
      const data = await fetchScrappaProfile(selectedAccount.username, true);
      
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
      <DialogContent className="flex h-[90vh] w-[calc(100vw-2rem)] max-w-[1200px] flex-col gap-0 overflow-hidden p-0 sm:max-w-[1200px] [&>button:last-child]:hidden">
        <DialogHeader className="shrink-0 space-y-0 border-b border-border p-4 text-left sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-secondary text-foreground">
                  <Instagram className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-[20px] font-semibold text-foreground">Integrações do Instagram</DialogTitle>
                  <DialogDescription className="text-[14px] text-muted-foreground">Monitoramento via Scrappa API</DialogDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar integrações" className="-mr-2 -mt-1 md:hidden">
                <X aria-hidden="true" />
              </Button>
            </div>

            <div className="flex w-full items-center gap-2 md:w-auto">
              <div className="relative min-w-0 flex-1 md:w-80 md:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  aria-label="Buscar perfil do Instagram"
                  placeholder="Adicionar @username"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching} className="min-w-[124px]">
                {isSearching ? <><RefreshCw className="animate-spin" aria-hidden="true" /> Buscando…</> : "Buscar perfil"}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fechar integrações" className="hidden md:inline-flex">
                <X aria-hidden="true" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
          {/* Sidebar: connected accounts */}
          <aside className="flex max-h-[32%] shrink-0 flex-col border-b border-border bg-background md:max-h-none md:w-80 md:border-b-0 md:border-r">
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <SectionLabel>Contas integradas</SectionLabel>
              {connectedAccounts.length > 0 && (
                <span className="ml-auto text-[13px] tabular-nums text-muted-foreground">{connectedAccounts.length}</span>
              )}
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <div className="space-y-1 p-2">
                {connectedAccounts.length === 0 ? (
                  <p className="px-4 py-10 text-center text-[14px] text-muted-foreground">
                    Nenhuma conta conectada ainda.
                  </p>
                ) : (
                  connectedAccounts.map((acc) => {
                    const active = selectedAccount?.username === acc.username;
                    return (
                      <button
                        key={acc.username}
                        type="button"
                        onClick={() => setSelectedAccount(acc)}
                        aria-current={active ? "true" : undefined}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors duration-150",
                          active ? "bg-secondary" : "hover:bg-accent"
                        )}
                      >
                        <Avatar src={acc.profile_pic_url_hd} alt={`Foto de @${acc.username}`} className="h-10 w-10" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] font-semibold text-foreground">@{acc.username}</p>
                          <p className="truncate text-[13px] tabular-nums text-muted-foreground">{(acc.follower_count || 0).toLocaleString()} seguidores</p>
                        </div>
                        <ChevronRight className={cn("h-4 w-4 transition-opacity duration-150", active ? "text-foreground opacity-100" : "text-muted-foreground opacity-0")} aria-hidden="true" />
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </aside>

          {/* Main area */}
          <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
            {searchResult ? (
              /* Search result */
              <div className="mx-auto max-w-4xl">
                <section className="rounded-xl border border-border bg-card">
                  <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center">
                    <Avatar src={searchResult.profile_pic_url_hd} alt={`Foto de @${searchResult.username}`} className="h-20 w-20" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-[20px] font-semibold text-foreground">@{searchResult.username}</h2>
                        {searchResult.is_verified && (
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[hsl(var(--admin-info))]" aria-label="Verificado" />
                        )}
                      </div>
                      <p className="text-[15px] text-muted-foreground">{searchResult.full_name}</p>
                    </div>
                    <Button onClick={handleConnect} disabled={isSyncing} className="w-full sm:w-auto">
                      {isSyncing && <RefreshCw className="animate-spin" aria-hidden="true" />}
                      Importar para o sistema
                    </Button>
                  </div>

                  <dl className="grid grid-cols-3 divide-x divide-border border-b border-border">
                    {[
                      { label: 'Publicações', value: searchResult.media_count },
                      { label: 'Seguidores', value: searchResult.follower_count },
                      { label: 'Seguindo', value: searchResult.following_count },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col px-2 py-5 text-center">
                        <dt className="order-last mt-0.5 text-[13px] text-muted-foreground">{item.label}</dt>
                        <dd className="text-[20px] font-semibold tabular-nums text-foreground sm:text-[24px]">{(item.value || 0).toLocaleString()}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="space-y-5 p-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="Valor combinado (mensal)" htmlFor="import-monthly-value">
                        <div className="relative">
                          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-muted-foreground">R$</span>
                          <Input
                            id="import-monthly-value"
                            type="number"
                            inputMode="decimal"
                            value={importMonthlyValue}
                            onChange={(e) => setImportMonthlyValue(Number(e.target.value))}
                            className="pl-10 tabular-nums"
                            placeholder="0,00"
                          />
                        </div>
                      </Field>
                      <Field label="Dia de vencimento" htmlFor="import-payment-day">
                        <Input
                          id="import-payment-day"
                          type="number"
                          inputMode="numeric"
                          min={1}
                          max={31}
                          value={importPaymentDay}
                          onChange={(e) => setImportPaymentDay(Number(e.target.value))}
                          className="tabular-nums"
                          placeholder="Ex: 5"
                        />
                      </Field>
                    </div>

                    <div className="rounded-lg border border-border bg-background p-4">
                      <SectionLabel className="mb-2">Biografia</SectionLabel>
                      <p className="whitespace-pre-line text-[15px] leading-relaxed text-foreground">{searchResult.biography}</p>
                      {searchResult.external_url && (
                        <a href={searchResult.external_url} target="_blank" rel="noopener noreferrer" className="mt-2 block break-all text-[14px] text-muted-foreground underline underline-offset-4 hover:text-foreground">
                          {searchResult.external_url}
                        </a>
                      )}
                    </div>
                  </div>
                </section>
              </div>
            ) : selectedAccount ? (
              /* Account dashboard */
              <div key={selectedAccount.username} className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar src={selectedAccount.profile_pic_url_hd} alt={`Foto de @${selectedAccount.username}`} className="h-14 w-14" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="truncate text-[24px] font-semibold text-foreground">@{selectedAccount.username}</h2>
                        {selectedAccount.is_verified && (
                          <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[hsl(var(--admin-info))]" aria-label="Verificado" />
                        )}
                      </div>
                      <p className="truncate text-[15px] text-muted-foreground">{selectedAccount.full_name}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={syncAccount} disabled={isSyncing}>
                      <RefreshCw className={cn(isSyncing && "animate-spin")} aria-hidden="true" />
                      {isSyncing ? "Sincronizando…" : "Sincronizar agora"}
                    </Button>
                    <Button>Exportar relatório</Button>
                  </div>
                </div>

                <Tabs defaultValue="perfil" className="w-full">
                  <TabsList className="h-auto w-full justify-start overflow-x-auto sm:w-auto">
                    <TabsTrigger value="perfil" className="min-h-[36px] gap-2 px-4 text-[14px]">
                      <User className="h-4 w-4" aria-hidden="true" /> Perfil
                    </TabsTrigger>
                    <TabsTrigger value="posts" className="min-h-[36px] gap-2 px-4 text-[14px]">
                      <Grid3X3 className="h-4 w-4" aria-hidden="true" /> Posts
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="min-h-[36px] gap-2 px-4 text-[14px]">
                      <BarChart3 className="h-4 w-4" aria-hidden="true" /> Estatísticas
                    </TabsTrigger>
                  </TabsList>

                  {/* Profile */}
                  <TabsContent value="perfil" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <section className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-4 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <SectionLabel>Prévia do perfil</SectionLabel>
                        </div>
                        {/* Profile preview, laid out like the Instagram profile header */}
                        <div className="mx-auto max-w-md rounded-xl border border-border bg-background p-5">
                          <div className="mb-5 flex items-center gap-5">
                            <Avatar src={selectedAccount.profile_pic_url_hd} alt="" className="h-20 w-20" />
                            <dl className="flex flex-1 justify-around">
                              <div className="flex flex-col text-center">
                                <dt className="order-last text-[13px] text-muted-foreground">posts</dt>
                                <dd className="text-[15px] font-semibold tabular-nums">{selectedAccount.media_count}</dd>
                              </div>
                              <div className="flex flex-col text-center">
                                <dt className="order-last text-[13px] text-muted-foreground">seguidores</dt>
                                <dd className="text-[15px] font-semibold tabular-nums">{((selectedAccount.follower_count || 0) / 1000).toFixed(1)}k</dd>
                              </div>
                              <div className="flex flex-col text-center">
                                <dt className="order-last text-[13px] text-muted-foreground">seguindo</dt>
                                <dd className="text-[15px] font-semibold tabular-nums">{selectedAccount.following_count}</dd>
                              </div>
                            </dl>
                          </div>
                          <div className="mb-5 space-y-1">
                            <p className="text-[14px] font-semibold">@{selectedAccount.username}</p>
                            <p className="text-[14px] text-foreground">{selectedAccount.biography}</p>
                            {selectedAccount.external_url && (
                              <p className="truncate text-[14px] text-[hsl(var(--admin-info))]">{selectedAccount.external_url}</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="secondary" size="sm" className="flex-1">Seguir</Button>
                            <Button variant="secondary" size="sm" className="flex-1">Mensagem</Button>
                          </div>
                        </div>
                      </section>

                      <div className="space-y-6">
                        <section className="rounded-xl border border-border bg-card p-5">
                          <SectionLabel className="mb-2">Informações gerais</SectionLabel>
                          <dl className="divide-y divide-border">
                            <div className="flex items-center justify-between py-3">
                              <dt className="text-[14px] text-muted-foreground">Status da conta</dt>
                              <dd><StatusBadge tone="success">Público</StatusBadge></dd>
                            </div>
                            <div className="flex items-center justify-between py-3">
                              <dt className="text-[14px] text-muted-foreground">Sincronizado há</dt>
                              <dd className="text-[14px] font-medium tabular-nums text-foreground">5 minutos</dd>
                            </div>
                            <div className="flex items-center justify-between py-3">
                              <dt className="text-[14px] text-muted-foreground">Engajamento médio</dt>
                              <dd className="text-[14px] font-medium tabular-nums text-foreground">4.82%</dd>
                            </div>
                          </dl>
                        </section>

                        <dl className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl border border-border bg-card p-4">
                            <dt className="text-[13px] text-muted-foreground">Taxa de conversão</dt>
                            <dd className="mt-1 text-[24px] font-semibold tabular-nums">2.4%</dd>
                          </div>
                          <div className="rounded-xl border border-border bg-card p-4">
                            <dt className="text-[13px] text-muted-foreground">Crescimento no mês</dt>
                            <dd className="mt-1 text-[24px] font-semibold tabular-nums">+14.2%</dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Posts */}
                  <TabsContent value="posts" className="mt-6">
                    {selectedPosts.length === 0 ? (
                      <EmptyState icon={<Grid3X3 />} title="Nenhum post importado ainda." description="Sincronize a conta para trazer os posts recentes." />
                    ) : (
                      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {selectedPosts.map((post) => (
                          <li key={post.id}>
                            <a
                              href={post.post_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group relative block aspect-square overflow-hidden rounded-lg border border-border bg-card transition-colors duration-150 hover:border-input"
                            >
                              <div className="flex h-full w-full items-center justify-center overflow-hidden p-3 text-center text-[13px] text-muted-foreground">
                                {post.caption?.substring(0, 50)}...
                              </div>
                              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 border-t border-border bg-card py-2 text-[13px] tabular-nums text-foreground opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                                <span className="flex items-center gap-1"><Heart className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Curtidas:</span> {post.likes}</span>
                                <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Comentários:</span> {post.comments}</span>
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </TabsContent>

                  {/* Stats */}
                  <TabsContent value="stats" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <section className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-6 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[15px] font-semibold text-foreground">Crescimento de seguidores</h3>
                            <p className="mt-0.5 text-[13px] text-muted-foreground">Últimos 30 dias</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-[hsl(var(--admin-success))]">
                            <TrendingUp className="h-4 w-4" aria-hidden="true" />
                            <span className="text-[14px] font-semibold tabular-nums">+420</span>
                          </div>
                        </div>
                        <div className="h-[260px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={selectedHistory.length > 0 ? selectedHistory : [{date: new Date().toISOString(), followers: selectedAccount.follower_count}]}>
                              <defs>
                                <linearGradient id="colorFollow" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="hsl(var(--admin-info))" stopOpacity={0.25}/>
                                  <stop offset="95%" stopColor="hsl(var(--admin-info))" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
                              <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={CHART_TICK}
                                tickFormatter={(val) => format(new Date(val), 'dd MMM')}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={CHART_TICK}
                              />
                              <Tooltip
                                contentStyle={CHART_TOOLTIP}
                                itemStyle={{ color: 'hsl(var(--admin-info))' }}
                              />
                              <Area
                                type="monotone"
                                dataKey="followers"
                                stroke="hsl(var(--admin-info))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorFollow)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </section>

                      <section className="rounded-xl border border-border bg-card p-5">
                        <div className="mb-6 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[15px] font-semibold text-foreground">Engajamento por dia</h3>
                            <p className="mt-0.5 text-[13px] text-muted-foreground">Interações médias</p>
                          </div>
                          <StatusBadge tone="neutral">Top: domingo</StatusBadge>
                        </div>
                        <div className="h-[260px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={selectedPosts.slice(0, 7).map(p => ({ name: format(new Date(p.date), 'dd/MM'), engagement: ((p.likes + p.comments) / 100).toFixed(2) }))}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_GRID} />
                              <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={CHART_TICK}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={CHART_TICK}
                              />
                              <Tooltip
                                contentStyle={CHART_TOOLTIP}
                                cursor={{ fill: 'hsl(var(--accent))' }}
                              />
                              <Bar dataKey="engagement" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </section>
                    </div>

                    <dl className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {[
                        { label: 'Sexta às 18:00', value: 'Melhor horário', icon: Clock },
                        { label: 'Vídeo/Reels', value: 'Melhor formato', icon: Grid3X3 },
                        { label: '2.4 posts/dia', value: 'Frequência ideal', icon: Calendar }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
                          <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-secondary text-muted-foreground">
                            <item.icon className="h-5 w-5" aria-hidden="true" />
                          </div>
                          <div className="min-w-0">
                            <dt className="text-[13px] text-muted-foreground">{item.label}</dt>
                            <dd className="text-[15px] font-semibold text-foreground">{item.value}</dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              /* Welcome state */
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <div className="mb-5 grid h-14 w-14 place-items-center rounded-full bg-secondary text-muted-foreground">
                  <Instagram className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="text-[20px] font-semibold text-foreground">Comece por aqui</h3>
                <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed text-muted-foreground">
                  Utilize a Scrappa API para conectar contas do Instagram e obter análises em tempo real, posts recentes e estatísticas de engajamento.
                </p>
                <dl className="mt-6 flex gap-3">
                  <div className="flex flex-col rounded-xl border border-border bg-card px-5 py-3">
                    <dt className="order-last text-[13px] text-muted-foreground">Créditos API</dt>
                    <dd className="text-[17px] font-semibold tabular-nums text-foreground">500</dd>
                  </div>
                  <div className="flex flex-col rounded-xl border border-border bg-card px-5 py-3">
                    <dt className="order-last text-[13px] text-muted-foreground">Monitoramento</dt>
                    <dd className="text-[17px] font-semibold text-foreground">∞</dd>
                  </div>
                </dl>
              </div>
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}
