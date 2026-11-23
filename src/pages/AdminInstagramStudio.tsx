import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Film,
  Hash,
  Heart,
  Image as ImageIcon,
  Layers,
  Loader2,
  MessageCircle,
  Music,
  Play,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  Upload,
  Users,
  X,
  AlertCircle,
  CheckCircle2,
  Link2,
} from "lucide-react";
import { toast } from "sonner";
import { AdminPage } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { uploadToImageKit } from "@/lib/imagekit";
import {
  type ConnectedIgAccount,
  type HashtagGroup,
  type LiveIgComment,
  type LiveIgMedia,
  type LiveMediaStats,
  type ScheduledIgPost,
  type ScheduledPostStatus,
  type StudioMediaType,
  createHashtagGroup,
  createScheduledPost,
  deleteHashtagGroup,
  deleteScheduledPost,
  disconnectAccount,
  fetchLiveAccountFeed,
  fetchLiveMediaComments,
  fetchLiveMediaStats,
  setLiveMediaCommentsEnabled,
  getMetaOAuthUrl,
  listConnectedAccounts,
  listHashtagGroups,
  listScheduledPosts,
  publishPostNow,
  replyToLiveComment,
  saveManualTokenAccount,
  updateScheduledPost,
} from "@/lib/igStudio";

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const MEDIA_TYPE_OPTIONS: { value: StudioMediaType; label: string; icon: typeof ImageIcon }[] = [
  { value: "IMAGE", label: "Foto", icon: ImageIcon },
  { value: "CAROUSEL", label: "Carrossel", icon: Layers },
  { value: "REELS", label: "Reels / Vídeo", icon: Film },
  { value: "STORIES", label: "Stories", icon: Sparkles },
];

const STATUS_META: Record<
  ScheduledPostStatus,
  { label: string; cls: string }
> = {
  rascunho: { label: "Rascunho", cls: "bg-white/10 text-white/75 border-white/15" },
  agendado: { label: "Agendado", cls: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  publicando: { label: "Publicando…", cls: "bg-sky-500/15 text-sky-300 border-sky-400/30" },
  publicado: { label: "Publicado", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  erro: { label: "Erro", cls: "bg-red-500/15 text-red-300 border-red-400/30" },
  lembrete_musica: {
    label: "Lembrete (Áudio IG)",
    cls: "bg-violet-500/15 text-violet-300 border-violet-400/30",
  },
};

/** Contador de dias até o token da Meta vencer. */
function tokenCountdown(expiresAt: string | null): { label: string; className: string } {
  if (!expiresAt) {
    return { label: "Validade do token desconhecida", className: "border-white/15 bg-white/5 text-white/60" };
  }
  const ms = new Date(expiresAt).getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
  if (ms <= 0) {
    return { label: "Token vencido · conecte de novo", className: "border-red-400/40 bg-red-500/15 text-red-300" };
  }
  const label = days === 1 ? "Token vence em 1 dia" : `Token vence em ${days} dias`;
  if (days <= 3) return { label, className: "border-red-400/40 bg-red-500/15 text-red-300" };
  if (days <= 14) return { label, className: "border-amber-400/40 bg-amber-500/15 text-amber-200" };
  return { label, className: "border-emerald-400/40 bg-emerald-500/15 text-emerald-200" };
}

function toLocalDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function dayKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AdminInstagramStudio() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<"calendario" | "feed" | "contas">("calendario");

  // Data state
  const [accounts, setAccounts] = useState<ConnectedIgAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledIgPost[]>([]);
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [schemaMissing, setSchemaMissing] = useState(false);

  // Live feed & comments state
  const [liveMedia, setLiveMedia] = useState<LiveIgMedia[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [activeMedia, setActiveMedia] = useState<LiveIgMedia | null>(null);
  const [mediaStats, setMediaStats] = useState<LiveMediaStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [togglingComments, setTogglingComments] = useState(false);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [comments, setComments] = useState<LiveIgComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Calendar state
  const [calMonth, setCalMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Post Composer modal state
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [mediaType, setMediaType] = useState<StudioMediaType>("IMAGE");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [manualUrl, setManualUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [musicName, setMusicName] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [locationName, setLocationName] = useState("");
  const [scheduledFor, setScheduledFor] = useState(() => {
    const d = new Date();
    d.setHours(18, 0, 0, 0);
    return toLocalDateTimeInput(d);
  });
  const [targetAccountIds, setTargetAccountIds] = useState<string[]>([]);
  const [whenMode, setWhenMode] = useState<"agora" | "horario">("agora");
  const [status, setStatus] = useState<ScheduledPostStatus>("agendado");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [savingPost, setSavingPost] = useState(false);
  const [publishingPost, setPublishingPost] = useState(false);

  // Connect Account / Hashtags state
  const [manualToken, setManualToken] = useState("");
  const [connectingToken, setConnectingToken] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupTags, setNewGroupTags] = useState("");

  const loadAll = useCallback(async () => {
    setLoadingInit(true);
    setSchemaMissing(false);
    try {
      const [accs, posts, groups] = await Promise.all([
        listConnectedAccounts(),
        listScheduledPosts(),
        listHashtagGroups(),
      ]);
      setAccounts(accs);
      setScheduledPosts(posts);
      setHashtagGroups(groups);
      if (accs.length > 0 && !selectedAccountId) {
        setSelectedAccountId(accs[0].id);
      }
    } catch (err: any) {
      const msg = String(err?.message || "");
      if (msg.includes("relation") || msg.includes("does not exist") || msg.includes("42P01")) {
        setSchemaMissing(true);
      } else {
        toast.error(msg || "Erro ao carregar dados do Instagram Studio.");
      }
    } finally {
      setLoadingInit(false);
    }
  }, [selectedAccountId]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Handle OAuth callback query params (?connected=1 or ?error=...)
  useEffect(() => {
    const connected = searchParams.get("connected");
    const err = searchParams.get("error");
    if (connected) {
      toast.success(`${connected} conta(s) do Instagram conectada(s) com sucesso!`);
      searchParams.delete("connected");
      setSearchParams(searchParams, { replace: true });
      loadAll();
    } else if (err) {
      toast.error(err);
      searchParams.delete("error");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, loadAll]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null,
    [accounts, selectedAccountId]
  );

  const loadLiveFeed = useCallback(async (accId: string) => {
    if (!accId) return;
    setLoadingFeed(true);
    setFeedError(null);
    try {
      const data = await fetchLiveAccountFeed(accId);
      setLiveMedia(data.media || []);
      setAccounts((prev) =>
        prev.map((a) => (a.id === accId ? { ...a, ...data.account, id: a.id } : a))
      );
    } catch (err: any) {
      setFeedError(err?.message || "Erro ao sincronizar feed com a Meta.");
    } finally {
      setLoadingFeed(false);
    }
  }, []);

  useEffect(() => {
    if ((activeTab === "feed" || activeTab === "calendario") && selectedAccount?.id) {
      loadLiveFeed(selectedAccount.id);
    }
  }, [activeTab, selectedAccount?.id, loadLiveFeed]);

  // Sincroniza sozinho: a cada 2 minutos e sempre que você volta para esta aba,
  // para posts feitos direto pelo Instagram aparecerem aqui.
  useEffect(() => {
    const accId = selectedAccount?.id;
    if (!accId || activeTab === "contas") return;
    const sync = () => {
      if (document.visibilityState === "visible") loadLiveFeed(accId);
    };
    const timer = window.setInterval(sync, 2 * 60 * 1000);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [activeTab, selectedAccount?.id, loadLiveFeed]);

  const openMediaDetail = async (item: LiveIgMedia) => {
    setActiveMedia(item);
    setActiveSlideIdx(0);
    setReplyTargetId(null);
    setReplyText("");
    setComments([]);
    setMediaStats(null);
    if (!selectedAccount?.id) return;
    const accId = selectedAccount.id;
    setLoadingStats(true);
    fetchLiveMediaStats(accId, item.id)
      .then((st) => setMediaStats(st))
      .catch(() => setMediaStats(null))
      .finally(() => setLoadingStats(false));
    setLoadingComments(true);
    try {
      const list = await fetchLiveMediaComments(selectedAccount.id, item.id);
      setComments(list);
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível carregar os comentários.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSendReply = async (commentId: string) => {
    if (!selectedAccount?.id || !replyText.trim()) return;
    setSendingReply(true);
    try {
      await replyToLiveComment(selectedAccount.id, commentId, replyText.trim());
      toast.success("Resposta publicada no Instagram!");
      setReplyText("");
      setReplyTargetId(null);
      if (activeMedia) {
        const refreshed = await fetchLiveMediaComments(selectedAccount.id, activeMedia.id);
        setComments(refreshed);
      }
    } catch (err: any) {
      toast.error(err?.message || "Erro ao responder comentário.");
    } finally {
      setSendingReply(false);
    }
  };

  // Calendar grid days
  const calendarDays = useMemo(() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month, -i), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const nextIdx = cells.length - (firstDayOfWeek + daysInMonth) + 1;
      cells.push({ date: new Date(year, month + 1, nextIdx), inMonth: false });
    }
    return cells;
  }, [calMonth]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledIgPost[]>();
    for (const p of scheduledPosts) {
      const key = dayKey(new Date(p.scheduled_for));
      const arr = map.get(key) || [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [scheduledPosts]);

  // Posts já publicados no Instagram (vindos do feed), para mostrar no calendário
  const publishedByDay = useMemo(() => {
    const studioIds = new Set<string>();
    for (const p of scheduledPosts) {
      for (const r of (p.publish_results || []) as { ig_media_id?: string }[]) {
        if (r?.ig_media_id) studioIds.add(String(r.ig_media_id));
      }
    }
    const map = new Map<string, LiveIgMedia[]>();
    for (const m of liveMedia) {
      if (!m.timestamp || studioIds.has(String(m.id))) continue;
      const key = dayKey(new Date(m.timestamp));
      const arr = map.get(key) || [];
      arr.push(m);
      map.set(key, arr);
    }
    return map;
  }, [liveMedia, scheduledPosts]);

  // Open Composer for new post on clicked day
  const openNewComposer = (date?: Date) => {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(18, 0, 0, 0);
    if (targetDate.getTime() <= Date.now()) {
      // horário sugerido já passou: sugere a próxima hora cheia
      const next = new Date();
      next.setHours(next.getHours() + 1, 0, 0, 0);
      targetDate.setTime(next.getTime());
    }
    const isToday = !date || new Date(date).toDateString() === new Date().toDateString();
    setWhenMode(isToday ? "agora" : "horario");
    setEditingPostId(null);
    setTitle("");
    setMediaType("IMAGE");
    setMediaUrls([]);
    setManualUrl("");
    setCoverUrl("");
    setCaption("");
    setHashtags("");
    setMusicName("");
    setMusicUrl("");
    setLocationName("");
    setScheduledFor(toLocalDateTimeInput(targetDate));
    setTargetAccountIds(accounts.length > 0 ? [selectedAccount?.id || accounts[0].id] : []);
    setStatus("agendado");
    setComposerOpen(true);
  };

  const openEditComposer = (post: ScheduledIgPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setMediaType(post.media_type);
    setMediaUrls(Array.isArray(post.media_urls) ? post.media_urls : []);
    setManualUrl("");
    setCoverUrl(post.cover_url || "");
    setCaption(post.caption || "");
    setHashtags(post.hashtags || "");
    setMusicName(post.music_name || "");
    setMusicUrl(post.music_url || "");
    setLocationName(post.location_name || "");
    setScheduledFor(toLocalDateTimeInput(new Date(post.scheduled_for)));
    setWhenMode("horario");
    setTargetAccountIds(post.target_account_ids || []);
    setStatus(post.status);
    setComposerOpen(true);
  };

  const handleUploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadingMedia(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const res = await uploadToImageKit(file, "gofocus/instagram-studio");
        uploaded.push(res.url);
      }
      setMediaUrls((prev) => {
        const next = [...prev, ...uploaded];
        if (next.length > 1 && mediaType === "IMAGE") {
          setMediaType("CAROUSEL");
        }
        return next;
      });
      toast.success(`${uploaded.length} arquivo(s) enviado(s) com sucesso.`);
    } catch (err: any) {
      toast.error(err?.message || "Erro no upload da mídia para o ImageKit.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleUploadCover = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    setUploadingMedia(true);
    try {
      const res = await uploadToImageKit(files[0], "gofocus/instagram-studio/covers");
      setCoverUrl(res.url);
      toast.success("Capa do Reel enviada!");
    } catch (err: any) {
      toast.error(err?.message || "Erro ao enviar capa.");
    } finally {
      setUploadingMedia(false);
    }
  };

  const toggleTargetAccount = (id: string) => {
    setTargetAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSavePost = async (mode: "rascunho" | "agendado" | "lembrete_musica" | "publicar") => {
    if (!title.trim()) {
      toast.error("Dê um título interno para identificar esta postagem no calendário.");
      return;
    }
    if (mode !== "rascunho" && mediaUrls.length === 0) {
      toast.error("Envie pelo menos uma foto ou vídeo antes de agendar ou publicar.");
      return;
    }
    if (mode === "publicar" && targetAccountIds.length === 0) {
      toast.error("Selecione pelo menos uma conta conectada para publicar.");
      return;
    }
    if (mode === "agendado" && new Date(scheduledFor).getTime() <= Date.now()) {
      toast.error("Esse horário já passou. Escolha um horário no futuro ou use Postar agora.");
      return;
    }

    const nextStatus: ScheduledPostStatus =
      mode === "publicar" ? "agendado" : mode;

    const payload = {
      title: title.trim(),
      media_type: mediaType,
      media_urls: mediaUrls,
      cover_url: coverUrl.trim() || null,
      caption: caption.trim(),
      hashtags: hashtags.trim(),
      music_name: musicName.trim(),
      music_url: musicUrl.trim(),
      location_name: locationName.trim(),
      scheduled_for: (mode === "publicar" ? new Date() : new Date(scheduledFor)).toISOString(),
      target_account_ids: targetAccountIds,
      status: nextStatus,
    };

    setSavingPost(true);
    try {
      let saved: ScheduledIgPost;
      if (editingPostId) {
        saved = await updateScheduledPost(editingPostId, payload);
      } else {
        saved = await createScheduledPost(payload);
      }

      if (mode === "publicar") {
        setPublishingPost(true);
        const pub = await publishPostNow(saved.id);
        const okCount = pub.results.filter((r) => r.ok).length;
        const failCount = pub.results.length - okCount;
        if (okCount > 0 && failCount === 0) {
          toast.success(`Publicado com sucesso em ${okCount} conta(s)!`);
        } else if (okCount > 0) {
          toast.warning(`Publicado em ${okCount} conta(s), mas ${failCount} falhou.`);
        } else {
          toast.error("Falha ao publicar no Instagram. Verifique os detalhes no card.");
        }
      } else {
        toast.success(
          mode === "rascunho"
            ? "Rascunho salvo no calendário."
            : mode === "lembrete_musica"
            ? "Salvo como lembrete com música de referência!"
            : `Programado para ${targetAccountIds.length || 1} conta(s)!`
        );
      }

      setComposerOpen(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar programação.");
    } finally {
      setSavingPost(false);
      setPublishingPost(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Excluir esta programação do calendário?")) return;
    try {
      await deleteScheduledPost(id);
      toast.success("Programação removida.");
      setComposerOpen(false);
      await loadAll();
    } catch (err: any) {
      toast.error(err?.message || "Erro ao excluir.");
    }
  };

  const handleConnectOAuth = async () => {
    try {
      const data = await getMetaOAuthUrl();
      if (!data.configured || !data.url) {
        toast.error(
          "Configure META_APP_ID e META_APP_SECRET na Vercel ou conecte usando um Token Manual abaixo."
        );
        return;
      }
      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err?.message || "Erro ao iniciar login da Meta.");
    }
  };

  const handleConnectManualToken = async () => {
    if (!manualToken.trim()) {
      toast.error("Cole o Access Token da Meta primeiro.");
      return;
    }
    setConnectingToken(true);
    try {
      const res = await saveManualTokenAccount({ accessToken: manualToken.trim() });
      toast.success(`${res.accounts.length} conta(s) conectada(s) com sucesso!`);
      setManualToken("");
      await loadAll();
    } catch (err: any) {
      toast.error(err?.message || "Não foi possível validar esse token.");
    } finally {
      setConnectingToken(false);
    }
  };

  const handleAddHashtagGroup = async () => {
    if (!newGroupName.trim() || !newGroupTags.trim()) return;
    try {
      await createHashtagGroup(newGroupName.trim(), newGroupTags.trim());
      setNewGroupName("");
      setNewGroupTags("");
      toast.success("Grupo de hashtags salvo!");
      const groups = await listHashtagGroups();
      setHashtagGroups(groups);
    } catch (err: any) {
      toast.error(err?.message || "Erro ao salvar grupo.");
    }
  };

  return (
    <AdminPage
      title="Instagram Studio"
      description="Gerencie feed, vídeos, comentários e agende publicações em múltiplas contas no mesmo horário."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab("contas")}
            className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10"
          >
            <Users className="h-4 w-4" />
            Contas ({accounts.length})
          </Button>
          <Button
            onClick={() => openNewComposer(new Date())}
            className="gap-2 bg-[#E2A820] text-black font-semibold hover:bg-[#f0b936]"
          >
            <Plus className="h-4 w-4" />
            Nova Programação
          </Button>
        </div>
      }
    >
      {/* Schema missing notice */}
      {schemaMissing && (
        <div className="mb-6 rounded-[20px] border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div className="space-y-1.5">
              <p className="font-semibold text-white">
                Falta criar as tabelas do Instagram Studio no Supabase
              </p>
              <p className="text-amber-100/80">
                Abra o <b>SQL Editor</b> do seu Supabase, cole o conteúdo do arquivo{" "}
                <code className="rounded bg-black/40 px-1.5 py-0.5 text-amber-200">
                  supabase/ig_studio.sql
                </code>{" "}
                e clique em <b>Run</b>. Depois recarregue esta tela.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Account switcher + main tabs */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.04] p-1">
          {(
            [
              { id: "calendario", label: "Calendário & Agendamento", icon: CalendarIcon },
              { id: "feed", label: "Feed, Vídeos & Comentários", icon: Film },
              { id: "contas", label: "Contas & Hashtags", icon: Users },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition-all",
                activeTab === t.id
                  ? "bg-white text-black shadow-sm"
                  : "text-white/70 hover:text-white"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Connected Account Selector Pills */}
        {accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {accounts.map((acc) => {
              const active = acc.id === selectedAccount?.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] transition-all",
                    active
                      ? "border-[#E2A820] bg-[#E2A820]/15 text-white"
                      : "border-white/10 bg-white/[0.04] text-white/70 hover:border-white/25 hover:text-white"
                  )}
                >
                  {acc.profile_picture_url ? (
                    <img
                      src={acc.profile_picture_url}
                      alt={acc.username}
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-white/15 text-[10px] font-bold">
                      {acc.username.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span>@{acc.username}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loadingInit ? (
        <div className="flex min-h-[320px] items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Carregando Instagram Studio…
        </div>
      ) : null}

      {/* ============================================================
          TAB 1: CALENDÁRIO & PROGRAMAÇÃO MULTI-CONTAS
         ============================================================ */}
      {!loadingInit && activeTab === "calendario" && (
        <div className="space-y-6">
          <section className="lg rounded-[20px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            {/* Calendar Header */}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-[20px] font-semibold text-white">
                  {MONTHS_PT[calMonth.getMonth()]} {calMonth.getFullYear()}
                </h2>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[12px] text-white/70">
                  Clique em qualquer dia para programar
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => {
                    const now = new Date();
                    setCalMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                  }}
                >
                  Hoje
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() =>
                    setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8 border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() =>
                    setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Weekday labels */}
            <div className="mb-2 grid grid-cols-7 gap-2 text-center text-[12px] font-medium uppercase tracking-wider text-white/50">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map(({ date, inMonth }) => {
                const key = dayKey(date);
                const isToday = key === dayKey(new Date());
                const dayPosts = postsByDay.get(key) || [];
                const dayPublished = publishedByDay.get(key) || [];
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const isPast = date.getTime() < todayStart.getTime();
                return (
                  <div
                    key={key}
                    onClick={isPast ? undefined : () => openNewComposer(date)}
                    className={cn(
                      "group min-h-[112px] rounded-xl border p-2 transition-all",
                      isPast ? "cursor-default" : "cursor-pointer",
                      !inMonth
                        ? "border-white/[0.04] bg-transparent opacity-40"
                        : isPast
                          ? "border-white/[0.06] bg-black/20"
                          : "border-white/10 bg-white/[0.025] hover:border-[#E2A820]/60 hover:bg-white/[0.06]",
                      !inMonth && !isPast && "hover:opacity-75",
                      isToday && "border-[#E2A820]/70 bg-[#E2A820]/[0.06]"
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span
                        className={cn(
                          "grid h-6 w-6 place-items-center rounded-full text-[12px] font-semibold",
                          isToday ? "bg-[#E2A820] text-black" : isPast ? "text-white/35" : "text-white/80"
                        )}
                      >
                        {date.getDate()}
                      </span>
                      {!isPast && (
                        <Plus className="h-3.5 w-3.5 text-white/30 opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </div>

                    <div className="space-y-1">
                      {dayPosts.map((post) => {
                        const dt = new Date(post.scheduled_for);
                        const hhmm = dt.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const meta = STATUS_META[post.status];
                        return (
                          <button
                            key={post.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditComposer(post);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between gap-1 rounded-lg border px-2 py-1 text-left text-[11px] transition-transform hover:scale-[1.01]",
                              meta.cls
                            )}
                          >
                            <span className="truncate font-medium">
                              {hhmm} · {post.title}
                            </span>
                            {post.target_account_ids.length > 1 && (
                              <span className="shrink-0 rounded bg-black/30 px-1 text-[10px]">
                                {post.target_account_ids.length}x
                              </span>
                            )}
                          </button>
                        );
                      })}
                      {dayPublished.map((m) => {
                        const hhmm = new Date(m.timestamp).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const kind =
                          m.media_product_type === "REELS"
                            ? "Reels"
                            : m.media_type === "CAROUSEL_ALBUM"
                              ? "Carrossel"
                              : m.media_type === "VIDEO"
                                ? "Vídeo"
                                : "Foto";
                        const thumb = m.thumbnail_url || m.media_url;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openMediaDetail(m);
                            }}
                            title={m.caption ? m.caption.slice(0, 140) : "Ver post"}
                            className="flex w-full items-center gap-1.5 rounded-lg border border-white/15 bg-white/[0.06] px-1.5 py-1 text-[11px] text-white/80 transition-colors hover:bg-white/[0.12]"
                          >
                            {thumb ? (
                              <img src={thumb} alt="" className="h-5 w-5 shrink-0 rounded object-cover" />
                            ) : null}
                            <span className="truncate">
                              {hhmm} · {m.is_collab ? `Collab @${m.owner_username}` : `${kind} publicado`}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Upcoming Queue List */}
          <section className="lg rounded-[20px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <h3 className="mb-4 text-[17px] font-semibold text-white">
              Fila de Programações ({scheduledPosts.length})
            </h3>
            {scheduledPosts.length === 0 ? (
              <p className="text-[14px] text-white/60">
                Nenhuma postagem programada ainda. Clique em qualquer dia do calendário acima para criar a primeira.
              </p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {scheduledPosts.map((post) => {
                  const meta = STATUS_META[post.status];
                  const dt = new Date(post.scheduled_for);
                  const targetNames = post.target_account_ids
                    .map((id) => accounts.find((a) => a.id === id)?.username)
                    .filter(Boolean);
                  return (
                    <div
                      key={post.id}
                      onClick={() => openEditComposer(post)}
                      className="flex cursor-pointer items-center gap-3.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3.5 transition-colors hover:border-white/25"
                    >
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/40">
                        {post.media_urls?.[0] ? (
                          /\.(mp4|mov|webm)(\?|$)/i.test(post.media_urls[0]) ? (
                            <div className="grid h-full w-full place-items-center bg-zinc-900 text-white/70">
                              <Film className="h-6 w-6" />
                            </div>
                          ) : (
                            <img
                              src={post.media_urls[0]}
                              alt={post.title}
                              className="h-full w-full object-cover"
                            />
                          )
                        ) : (
                          <div className="grid h-full w-full place-items-center text-white/30">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-semibold text-white">
                            {post.title}
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              meta.cls
                            )}
                          >
                            {meta.label}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-white/60">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {dt.toLocaleDateString("pt-BR")} às{" "}
                            {dt.toLocaleTimeString("pt-BR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          <span>{post.media_type}</span>
                          {post.music_name && (
                            <span className="flex items-center gap-1 text-violet-300">
                              <Music className="h-3.5 w-3.5" />
                              {post.music_name}
                            </span>
                          )}
                        </div>
                        {targetNames.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {targetNames.map((u) => (
                              <span
                                key={u}
                                className="rounded bg-white/10 px-1.5 py-0.5 text-[11px] text-white/80"
                              >
                                @{u}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ============================================================
          TAB 2: FEED COMPLETO, VÍDEOS, CURTIDAS E COMENTÁRIOS
         ============================================================ */}
      {!loadingInit && activeTab === "feed" && (
        <div className="space-y-6">
          {!selectedAccount ? (
            <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-10 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-white/40" />
              <h3 className="text-[18px] font-semibold text-white">
                Nenhuma conta do Instagram conectada ainda
              </h3>
              <p className="mx-auto mt-1.5 max-w-md text-[14px] text-white/65">
                Conecte a conta profissional da GoFocus (e de seus clientes) na aba{" "}
                <b>Contas & Hashtags</b> para visualizar todas as postagens, vídeos, curtidas e responder comentários aqui.
              </p>
              <Button
                onClick={() => setActiveTab("contas")}
                className="mt-5 bg-[#E2A820] text-black font-semibold hover:bg-[#f0b936]"
              >
                Conectar Instagram agora
              </Button>
            </div>
          ) : (
            <>
              {/* Profile Header Card */}
              <div className="flex flex-col gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  {selectedAccount.profile_picture_url ? (
                    <img
                      src={selectedAccount.profile_picture_url}
                      alt={selectedAccount.username}
                      className="h-16 w-16 rounded-full border border-white/15 object-cover"
                    />
                  ) : (
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-white/10 text-xl font-bold text-white">
                      {selectedAccount.username.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-[18px] font-semibold text-white">
                        @{selectedAccount.username}
                      </h2>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                        API Oficial
                      </span>
                    </div>
                    {selectedAccount.biography && (
                      <p className="mt-1 max-w-xl whitespace-pre-line text-[13px] text-white/65">
                        {selectedAccount.biography}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-white/80">
                      <span>
                        <b>{selectedAccount.media_count.toLocaleString("pt-BR")}</b> posts
                      </span>
                      <span>
                        <b>{selectedAccount.followers_count.toLocaleString("pt-BR")}</b> seguidores
                      </span>
                      <span>
                        <b>{selectedAccount.follows_count.toLocaleString("pt-BR")}</b> seguindo
                      </span>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  disabled={loadingFeed}
                  onClick={() => loadLiveFeed(selectedAccount.id)}
                  className="gap-2 border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  <RefreshCw className={cn("h-4 w-4", loadingFeed && "animate-spin")} />
                  Sincronizar Feed
                </Button>
              </div>

              {feedError && (
                <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 text-[13px] text-red-200">
                  {feedError}
                </div>
              )}

              {/* Media Grid */}
              {loadingFeed && liveMedia.length === 0 ? (
                <div className="flex min-h-[260px] items-center justify-center gap-2 text-white/60">
                  <Loader2 className="h-5 w-5 animate-spin" /> Buscando postagens, vídeos e curtidas…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {liveMedia.map((item) => {
                    const thumb = item.thumbnail_url || item.media_url;
                    const isVideo = item.media_type === "VIDEO";
                    const isCarousel = item.media_type === "CAROUSEL_ALBUM";
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openMediaDetail(item)}
                        className="group relative aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-left"
                      >
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={item.caption?.slice(0, 60) || "Post Instagram"}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="grid h-full w-full place-items-center text-white/30">
                            <ImageIcon className="h-8 w-8" />
                          </div>
                        )}

                        {item.is_collab && (
                          <div className="absolute left-2.5 top-2.5 max-w-[70%] truncate rounded-full bg-black/65 px-2 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                            Collab · @{item.owner_username}
                          </div>
                        )}

                        {/* Type badge */}
                        <div className="absolute right-2.5 top-2.5 rounded-full bg-black/65 p-1.5 text-white backdrop-blur-sm">
                          {isVideo ? (
                            <Play className="h-3.5 w-3.5 fill-white" />
                          ) : isCarousel ? (
                            <Layers className="h-3.5 w-3.5" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5" />
                          )}
                        </div>

                        {/* Stats overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-3 pt-10">
                          <div className="flex items-center gap-3 text-[12px] font-semibold text-white">
                            <span className="flex items-center gap-1">
                              <Heart className="h-3.5 w-3.5 fill-white" />
                              {item.like_count.toLocaleString("pt-BR")}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="h-3.5 w-3.5" />
                              {item.comments_count.toLocaleString("pt-BR")}
                            </span>
                          </div>
                          {item.caption && (
                            <p className="mt-1 line-clamp-2 text-[11px] text-white/75">
                              {item.caption}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============================================================
          TAB 3: CONTAS CONECTADAS & GRUPOS DE HASHTAGS
         ============================================================ */}
      {!loadingInit && activeTab === "contas" && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Connect Accounts */}
          <section className="rounded-[20px] border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <div>
              <h2 className="text-[18px] font-semibold text-white">
                Contas Profissionais Conectadas
              </h2>
              <p className="mt-1 text-[13px] text-white/65">
                Conecte a conta da GoFocus e as contas dos seus clientes para publicar e agendar em todas no mesmo horário.
              </p>
            </div>

            <Button
              onClick={handleConnectOAuth}
              className="w-full gap-2 bg-[#E2A820] text-black font-semibold hover:bg-[#f0b936]"
            >
              <Link2 className="h-4 w-4" />
              Conectar via Login Oficial da Meta (OAuth)
            </Button>

            {/* Quick Token Connection */}
            <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-[13px] font-medium text-white">
                  Ou conecte direto com Access Token (Graph API Explorer)
                </div>
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-white/20"
                >
                  Gerar token no Facebook <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Cole aqui o Token da Meta (EAAG…)"
                  className="bg-white/5 border-white/15 text-white"
                />
                <Button
                  disabled={connectingToken}
                  onClick={handleConnectManualToken}
                  variant="outline"
                  className="shrink-0 border-white/15 bg-white/10 text-white hover:bg-white/20"
                >
                  {connectingToken ? <Loader2 className="h-4 w-4 animate-spin" /> : "Conectar"}
                </Button>
              </div>
            </div>

            {/* Connected accounts list */}
            <div className="space-y-2.5">
              {accounts.length === 0 ? (
                <p className="text-[13px] text-white/50">Nenhuma conta conectada ainda.</p>
              ) : (
                accounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3"
                  >
                    <div className="flex items-center gap-3">
                      {acc.profile_picture_url ? (
                        <img
                          src={acc.profile_picture_url}
                          alt={acc.username}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-white/10 font-bold text-white">
                          {acc.username.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-[14px] font-semibold text-white">@{acc.username}</div>
                        <div className="text-[12px] text-white/55">
                          {acc.followers_count.toLocaleString("pt-BR")} seguidores · Página:{" "}
                          {acc.page_name || "Meta"}
                        </div>
                        {(() => {
                          const tc = tokenCountdown(acc.token_expires_at);
                          return (
                            <span
                              className={cn(
                                "mt-1.5 inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
                                tc.className
                              )}
                              title={acc.token_expires_at ? `Vence em ${new Date(acc.token_expires_at).toLocaleDateString("pt-BR")}` : undefined}
                            >
                              {tc.label}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-white/50 hover:bg-red-500/15 hover:text-red-300"
                      onClick={async () => {
                        if (!confirm(`Desconectar @${acc.username}?`)) return;
                        await disconnectAccount(acc.id);
                        toast.success("Conta removida.");
                        loadAll();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Hashtag Groups */}
          <section className="rounded-[20px] border border-white/10 bg-white/[0.03] p-6 space-y-5">
            <div>
              <h2 className="text-[18px] font-semibold text-white">Grupos de Hashtags</h2>
              <p className="mt-1 text-[13px] text-white/65">
                Salve pacotes de até 5 hashtags por nicho para inserir com 1 clique no agendamento.
              </p>
            </div>

            <div className="space-y-2.5">
              <Input
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nome do grupo (ex: Imóveis & Arquitetura)"
                className="bg-white/5 border-white/15 text-white"
              />
              <Textarea
                value={newGroupTags}
                onChange={(e) => setNewGroupTags(e.target.value)}
                placeholder="#videomaker #filmmaker #itapevasp #audiovisual"
                rows={2}
                className="bg-white/5 border-white/15 text-white"
              />
              <Button
                onClick={handleAddHashtagGroup}
                variant="outline"
                className="gap-2 border-white/15 bg-white/10 text-white hover:bg-white/20"
              >
                <Hash className="h-4 w-4" />
                Salvar Grupo
              </Button>
            </div>

            <div className="space-y-2.5">
              {hashtagGroups.map((g) => (
                <div
                  key={g.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3"
                >
                  <div>
                    <div className="text-[13px] font-semibold text-white">{g.name}</div>
                    <div className="mt-1 text-[12px] text-amber-200/80">{g.tags}</div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-white/40 hover:text-red-300"
                    onClick={async () => {
                      await deleteHashtagGroup(g.id);
                      setHashtagGroups((prev) => prev.filter((x) => x.id !== g.id));
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ============================================================
          MODAL 1: COMPOSITOR & PROGRAMADOR MULTI-CONTAS
         ============================================================ */}
      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-white/15 bg-[#101114] text-white">
          <DialogHeader>
            <DialogTitle className="text-[20px]">
              {editingPostId ? "Editar Programação" : "Nova Programação no Instagram"}
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Monte o conteúdo, escolha data/horário e marque todas as contas que receberão esta postagem.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-5">
            {/* Title + Media Type */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-white/70">
                  Título interno (no calendário)
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Carrossel Foto Perfeita no Celular"
                  className="border-white/15 bg-white/5 text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-medium text-white/70">
                  Quando postar
                </label>
                <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/15 bg-white/5 p-1">
                  {([
                    { id: "agora", label: "Postar agora", icon: Send },
                    { id: "horario", label: "Agendar", icon: CalendarIcon },
                  ] as const).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setWhenMode(opt.id)}
                      className={cn(
                        "flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg py-2 text-[13px] font-medium transition-colors",
                        whenMode === opt.id ? "bg-white text-black" : "text-white/70 hover:bg-white/10"
                      )}
                    >
                      <opt.icon className="h-3.5 w-3.5" />
                      {opt.label}
                    </button>
                  ))}
                </div>
                {whenMode === "horario" && (
                  <Input
                    type="datetime-local"
                    value={scheduledFor}
                    min={toLocalDateTimeInput(new Date())}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    className="border-white/15 bg-white/5 text-white"
                  />
                )}
              </div>
            </div>

            {/* Format selector */}
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-white/70">Formato da Postagem</label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MEDIA_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMediaType(opt.value)}
                    className={cn(
                      "flex items-center justify-center gap-2 rounded-xl border py-2.5 text-[13px] font-medium transition-all",
                      mediaType === opt.value
                        ? "border-[#E2A820] bg-[#E2A820]/15 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25"
                    )}
                  >
                    <opt.icon className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Upload (ImageKit) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-white/70">
                  Mídias ({mediaUrls.length} anexada{mediaUrls.length === 1 ? "" : "s"})
                </label>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#E2A820]/40 bg-[#E2A820]/15 px-3 py-1.5 text-[12px] font-semibold text-[#f3c34d] hover:bg-[#E2A820]/25">
                  {uploadingMedia ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Enviar fotos / vídeos
                  <input
                    type="file"
                    multiple={mediaType === "CAROUSEL"}
                    accept={mediaType === "REELS" ? "video/*" : "image/*,video/*"}
                    className="hidden"
                    onChange={(e) => handleUploadFiles(e.target.files)}
                  />
                </label>
              </div>

              {mediaUrls.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {mediaUrls.map((url, idx) => (
                    <div
                      key={`${url}-${idx}`}
                      className="relative h-24 w-24 overflow-hidden rounded-xl border border-white/15 bg-black"
                    >
                      {/\.(mp4|mov|webm)(\?|$)/i.test(url) ? (
                        <video src={url} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={url} alt={`Slide ${idx + 1}`} className="h-full w-full object-cover" />
                      )}
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setMediaUrls((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/80 text-white hover:bg-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                  placeholder="Ou cole uma URL pública (https://...)"
                  className="border-white/15 bg-white/5 text-[13px] text-white"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                  onClick={() => {
                    if (!manualUrl.trim()) return;
                    setMediaUrls((prev) => [...prev, manualUrl.trim()]);
                    setManualUrl("");
                  }}
                >
                  Adicionar
                </Button>
              </div>

              {mediaType === "REELS" && (
                <div className="flex items-center gap-2 pt-1">
                  <Input
                    value={coverUrl}
                    onChange={(e) => setCoverUrl(e.target.value)}
                    placeholder="URL da capa personalizada do Reel (opcional)"
                    className="border-white/15 bg-white/5 text-[13px] text-white"
                  />
                  <label className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-[12px] text-white hover:bg-white/10">
                    <Upload className="h-3.5 w-3.5" />
                    Capa
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUploadCover(e.target.files)}
                    />
                  </label>
                </div>
              )}
            </div>

            {/* Caption */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <label className="font-medium text-white/70">Legenda</label>
                <span className="text-white/45">{caption.length} / 2200 caracteres</span>
              </div>
              <Textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Escreva a legenda (os primeiros 125 caracteres aparecem antes do '... mais')..."
                className="border-white/15 bg-white/5 text-white"
              />
            </div>

            {/* Hashtags + Saved Groups */}
            <div className="space-y-2">
              <label className="text-[12px] font-medium text-white/70">Hashtags</label>
              <Input
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#videomaker #producaoaudiovisual #itapevasp"
                className="border-white/15 bg-white/5 text-white"
              />
              {hashtagGroups.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hashtagGroups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() =>
                        setHashtags((prev) => (prev.trim() ? `${prev.trim()} ${g.tags}` : g.tags))
                      }
                      className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/80 hover:border-[#E2A820]/60 hover:text-white"
                    >
                      <Hash className="h-3 w-3 text-[#E2A820]" />
                      {g.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Music / Audio Reference */}
            <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-[13px] font-medium text-white">
                <Music className="h-4 w-4 text-violet-300" />
                Música / Áudio da Postagem
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <Input
                  value={musicName}
                  onChange={(e) => setMusicName(e.target.value)}
                  placeholder="Nome da música ou áudio em alta"
                  className="border-white/15 bg-white/5 text-[13px] text-white"
                />
                <Input
                  value={musicUrl}
                  onChange={(e) => setMusicUrl(e.target.value)}
                  placeholder="Link do áudio no Instagram (opcional)"
                  className="border-white/15 bg-white/5 text-[13px] text-white"
                />
              </div>
              <p className="text-[11px] text-white/55">
                Reels editados com a trilha já no vídeo publicam 100% automático. Para usar música licenciada do catálogo do Instagram (que a Meta bloqueia via API), use o botão <b>Salvar como Lembrete (Áudio IG)</b>.
              </p>
            </div>

            {/* Multi-Account Target Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[12px] font-medium text-white/70">
                  Publicar simultaneamente nas contas ({targetAccountIds.length} selecionada
                  {targetAccountIds.length === 1 ? "" : "s"})
                </label>
                {accounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setTargetAccountIds(
                        targetAccountIds.length === accounts.length
                          ? []
                          : accounts.map((a) => a.id)
                      )
                    }
                    className="text-[12px] text-[#E2A820] hover:underline"
                  >
                    {targetAccountIds.length === accounts.length
                      ? "Desmarcar todas"
                      : "Selecionar todas"}
                  </button>
                )}
              </div>

              {accounts.length === 0 ? (
                <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 p-3 text-[12px] text-amber-200">
                  Você ainda pode salvar rascunhos e agendar no calendário, mas conecte pelo menos uma conta na aba <b>Contas & Hashtags</b> para disparar no Instagram.
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {accounts.map((acc) => {
                    const checked = targetAccountIds.includes(acc.id);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => toggleTargetAccount(acc.id)}
                        className={cn(
                          "flex items-center gap-2 rounded-xl border px-3 py-2 text-[13px] transition-all",
                          checked
                            ? "border-[#E2A820] bg-[#E2A820]/15 text-white"
                            : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/25"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-4 w-4 place-items-center rounded border",
                            checked
                              ? "border-[#E2A820] bg-[#E2A820] text-black"
                              : "border-white/30"
                          )}
                        >
                          {checked && <Check className="h-3 w-3 stroke-[3]" />}
                        </span>
                        <span>@{acc.username}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
              <div>
                {editingPostId && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="gap-1.5 text-red-300 hover:bg-red-500/15 hover:text-red-200"
                    onClick={() => handleDeletePost(editingPostId)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={savingPost}
                  onClick={() => handleSavePost("rascunho")}
                  className="border-white/15 bg-white/5 text-white hover:bg-white/10"
                >
                  Rascunho
                </Button>
                {musicName.trim() && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingPost}
                    onClick={() => handleSavePost("lembrete_musica")}
                    className="border-violet-400/35 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25"
                  >
                    Lembrete (Áudio IG)
                  </Button>
                )}
                {whenMode === "horario" && (
                <Button
                  type="button"
                  disabled={savingPost}
                  onClick={() => handleSavePost("agendado")}
                  className="gap-1.5 bg-white text-black font-semibold hover:bg-white/90"
                >
                  {savingPost && !publishingPost ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CalendarIcon className="h-4 w-4" />
                  )}
                  Agendar
                </Button>
                )}
                {whenMode === "agora" && (
                <Button
                  type="button"
                  disabled={savingPost || publishingPost || accounts.length === 0}
                  onClick={() => handleSavePost("publicar")}
                  className="gap-1.5 bg-[#E2A820] text-black font-semibold hover:bg-[#f0b936]"
                >
                  {publishingPost ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Postar agora
                </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============================================================
          MODAL 2: VISUALIZADOR DO POST + RESPOSTA DE COMENTÁRIOS
         ============================================================ */}
      <Dialog open={!!activeMedia} onOpenChange={(o) => !o && setActiveMedia(null)}>
        <DialogContent className="max-h-[92vh] w-[94vw] max-w-5xl sm:max-w-5xl overflow-hidden rounded-2xl border-white/10 bg-[#0d0e11] p-0 text-white shadow-2xl">
          {activeMedia && (
            <div className="grid max-h-[92vh] md:grid-cols-[minmax(0,440px)_1fr]">
              {/* Left: Media / Video / Carousel Player */}
              <div className="relative flex items-center justify-center bg-black md:h-[min(92vh,780px)] min-h-[340px]">
                {activeMedia.media_type === "CAROUSEL_ALBUM" &&
                activeMedia.children &&
                activeMedia.children.length > 0 ? (
                  <>
                    {activeMedia.children[activeSlideIdx]?.media_type === "VIDEO" ? (
                      <video
                        src={activeMedia.children[activeSlideIdx].media_url}
                        controls
                        className="h-full max-h-[92vh] w-full object-contain"
                      />
                    ) : (
                      <img
                        src={activeMedia.children[activeSlideIdx]?.media_url}
                        alt=""
                        className="h-full max-h-[92vh] w-full object-contain"
                      />
                    )}
                    {activeMedia.children.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/75 px-3 py-1 text-[12px]">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSlideIdx((i) => Math.max(0, i - 1))
                          }
                          disabled={activeSlideIdx === 0}
                          className="disabled:opacity-30"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span>
                          {activeSlideIdx + 1} / {activeMedia.children.length}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveSlideIdx((i) =>
                              Math.min((activeMedia.children?.length || 1) - 1, i + 1)
                            )
                          }
                          disabled={activeSlideIdx >= activeMedia.children.length - 1}
                          className="disabled:opacity-30"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : activeMedia.media_type === "VIDEO" && activeMedia.media_url ? (
                  <video
                    src={activeMedia.media_url}
                    poster={activeMedia.thumbnail_url}
                    controls
                    className="h-full max-h-[92vh] w-full object-contain"
                  />
                ) : (
                  <img
                    src={activeMedia.media_url || activeMedia.thumbnail_url}
                    alt=""
                    className="h-full max-h-[92vh] w-full object-contain"
                  />
                )}
              </div>

              {/* Right: Caption, Likes & Live Comments */}
              <div className="flex min-h-0 flex-col md:h-[min(92vh,780px)] md:border-l border-white/10">
                <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4 pr-12">
                  {selectedAccount?.profile_picture_url ? (
                    <img
                      src={selectedAccount.profile_picture_url}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/15"
                    />
                  ) : (
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-[13px] font-bold">
                      {(selectedAccount?.username || "G").slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">
                      {activeMedia.is_collab
                        ? `@${activeMedia.owner_username} + @${selectedAccount?.username || "instagram"}`
                        : `@${selectedAccount?.username || "instagram"}`}
                    </div>
                    {activeMedia.is_collab && (
                      <div className="text-[11px] font-medium text-[#E2A820]">Post em collab</div>
                    )}
                    <div className="text-[12px] text-white/50">
                      {new Date(activeMedia.timestamp).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <a
                    href={activeMedia.permalink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[12px] font-medium text-white/85 transition-colors hover:bg-white/10"
                  >
                    Abrir no Instagram <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  {/* Estatísticas */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                      Desempenho
                    </div>
                    {loadingStats ? (
                      <div className="flex items-center gap-2 text-[13px] text-white/55">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2.5">
                          {[
                            { label: "Visualizações", v: mediaStats?.insights.views },
                            { label: "Contas alcançadas", v: mediaStats?.insights.reach },
                          ].map((st) => (
                            <div
                              key={st.label}
                              className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] px-4 py-3"
                            >
                              <div className="text-[24px] font-semibold leading-tight tracking-tight">
                                {typeof st.v === "number" ? st.v.toLocaleString("pt-BR") : "—"}
                              </div>
                              <div className="mt-0.5 text-[12px] text-white/55">{st.label}</div>
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-4 divide-x divide-white/10 rounded-xl border border-white/10 bg-white/[0.03] py-3">
                          {[
                            { label: "Curtidas", v: activeMedia.like_count, icon: Heart },
                            { label: "Comentários", v: activeMedia.comments_count, icon: MessageCircle },
                            { label: "Salvos", v: mediaStats?.insights.saved, icon: null },
                            { label: "Envios", v: mediaStats?.insights.shares, icon: null },
                          ].map((st) => (
                            <div key={st.label} className="px-2 text-center">
                              <div className="text-[16px] font-semibold">
                                {typeof st.v === "number" ? st.v.toLocaleString("pt-BR") : "—"}
                              </div>
                              <div className="truncate text-[11px] text-white/50">{st.label}</div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Editar */}
                  <div className="space-y-3">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                      Ações
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={activeMedia.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-[12px] font-semibold text-black hover:bg-white/90"
                      >
                        Editar no Instagram <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      {!activeMedia.is_collab && (
                      <button
                        type="button"
                        disabled={togglingComments || !selectedAccount?.id}
                        onClick={async () => {
                          if (!selectedAccount?.id) return;
                          const next = mediaStats?.commentEnabled === false;
                          setTogglingComments(true);
                          try {
                            await setLiveMediaCommentsEnabled(selectedAccount.id, activeMedia.id, next);
                            setMediaStats((prev) =>
                              prev ? { ...prev, commentEnabled: next } : { insights: { views: null, reach: null, saved: null, shares: null, total_interactions: null }, commentEnabled: next }
                            );
                            toast.success(next ? "Comentários ativados." : "Comentários desativados.");
                          } catch (err: any) {
                            toast.error(err?.message || "Não foi possível alterar os comentários.");
                          } finally {
                            setTogglingComments(false);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3.5 py-1.5 text-[12px] font-medium text-white/85 hover:bg-white/10 disabled:opacity-50"
                      >
                        {togglingComments ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : mediaStats?.commentEnabled === false ? (
                          "Ativar comentários"
                        ) : (
                          "Desativar comentários"
                        )}
                      </button>
                      )}
                    </div>
                    <p className="text-[11px] leading-relaxed text-white/35">
                      A legenda e a mídia de um post publicado só podem ser editadas no app do Instagram.
                    </p>
                  </div>

                  {activeMedia.caption && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
                        Legenda
                      </div>
                      <p className="max-h-40 overflow-y-auto whitespace-pre-line rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] leading-relaxed text-white/80">
                        {activeMedia.caption}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="text-[12px] font-semibold uppercase tracking-wider text-white/50">
                      Comentários
                    </div>
                    {loadingComments ? (
                      <div className="flex items-center gap-2 py-4 text-[13px] text-white/55">
                        <Loader2 className="h-4 w-4 animate-spin" /> Carregando comentários…
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-[13px] text-white/50">Nenhum comentário neste post.</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="space-y-2 rounded-xl bg-white/[0.03] p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-[13px]">
                              <span className="font-semibold text-white">@{c.username}</span>{" "}
                              <span className="text-white/85">{c.text}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyTargetId(replyTargetId === c.id ? null : c.id);
                                setReplyText("");
                              }}
                              className="shrink-0 text-[11px] font-medium text-[#E2A820] hover:underline"
                            >
                              Responder
                            </button>
                          </div>

                          {c.replies && c.replies.length > 0 && (
                            <div className="space-y-1.5 border-l-2 border-white/10 pl-3">
                              {c.replies.map((r) => (
                                <div key={r.id} className="text-[12px] text-white/75">
                                  <span className="font-semibold text-white">@{r.username}</span>{" "}
                                  {r.text}
                                </div>
                              ))}
                            </div>
                          )}

                          {replyTargetId === c.id && (
                            <div className="flex gap-2 pt-1">
                              <Input
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Responder @${c.username}…`}
                                className="h-8 border-white/15 bg-black/40 text-[12px] text-white"
                              />
                              <Button
                                size="sm"
                                disabled={sendingReply || !replyText.trim()}
                                onClick={() => handleSendReply(c.id)}
                                className="h-8 bg-[#E2A820] text-black hover:bg-[#f0b936]"
                              >
                                {sendingReply ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Send className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPage>
  );
}
