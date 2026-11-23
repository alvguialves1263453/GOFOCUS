import { supabase } from "./supabase";

/** Chama as funções /api/instagram enviando o login do admin (sem login, o servidor recusa). */
async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers = new Headers(init.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

export type StudioMediaType = "IMAGE" | "CAROUSEL" | "REELS" | "STORIES";
export type ScheduledPostStatus =
  | "rascunho"
  | "agendado"
  | "publicando"
  | "publicado"
  | "erro"
  | "lembrete_musica";

export interface ConnectedIgAccount {
  id: string;
  ig_user_id: string;
  username: string;
  name: string;
  profile_picture_url: string;
  biography: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  token_expires_at: string | null;
  page_id: string | null;
  page_name: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
}

export interface PublishAccountResult {
  account_id: string;
  username: string;
  ok: boolean;
  ig_media_id?: string;
  permalink?: string;
  error?: string;
  published_at?: string;
}

export interface ScheduledIgPost {
  id: string;
  title: string;
  media_type: StudioMediaType;
  media_urls: string[];
  cover_url: string | null;
  caption: string;
  hashtags: string;
  music_name: string;
  music_url: string;
  location_name: string;
  scheduled_for: string;
  target_account_ids: string[];
  status: ScheduledPostStatus;
  publish_results: PublishAccountResult[];
  error_message: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface HashtagGroup {
  id: string;
  name: string;
  tags: string;
  created_at: string;
}

export interface LiveIgComment {
  id: string;
  text: string;
  username: string;
  timestamp: string;
  like_count?: number;
  replies?: LiveIgComment[];
}

export interface LiveIgMedia {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "FEED" | "REELS" | "STORY";
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  children?: { id: string; media_type: string; media_url: string; thumbnail_url?: string }[];
  /** true quando o post é de outra conta (collab ou marcação) */
  is_collab?: boolean;
  owner_username?: string;
  insights?: {
    views?: number;
    reach?: number;
    saved?: number;
    shares?: number;
  };
}

// ============================================================
// Contas Conectadas (Supabase)
// ============================================================

export async function listConnectedAccounts(): Promise<ConnectedIgAccount[]> {
  const { data, error } = await supabase
    .from("ig_connected_accounts")
    .select(
      "id, ig_user_id, username, name, profile_picture_url, biography, followers_count, follows_count, media_count, token_expires_at, page_id, page_name, is_active, last_synced_at, created_at"
    )
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as ConnectedIgAccount[];
}

export async function disconnectAccount(id: string): Promise<void> {
  const { error } = await supabase.from("ig_connected_accounts").delete().eq("id", id);
  if (error) throw error;
}

export async function saveManualTokenAccount(payload: {
  accessToken: string;
}): Promise<{ accounts: ConnectedIgAccount[] }> {
  const res = await apiFetch("/api/instagram/connect-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Falha ao conectar conta com token.");
  return data;
}

// ============================================================
// Postagens Agendadas (Supabase)
// ============================================================

export async function listScheduledPosts(): Promise<ScheduledIgPost[]> {
  const { data, error } = await supabase
    .from("ig_scheduled_posts")
    .select("*")
    .order("scheduled_for", { ascending: true });

  if (error) throw error;
  return (data || []) as ScheduledIgPost[];
}

export async function createScheduledPost(
  post: Omit<
    ScheduledIgPost,
    "id" | "publish_results" | "error_message" | "published_at" | "created_at" | "updated_at"
  >
): Promise<ScheduledIgPost> {
  const { data, error } = await supabase
    .from("ig_scheduled_posts")
    .insert([post])
    .select("*")
    .single();

  if (error) throw error;
  return data as ScheduledIgPost;
}

export async function updateScheduledPost(
  id: string,
  updates: Partial<ScheduledIgPost>
): Promise<ScheduledIgPost> {
  const { data, error } = await supabase
    .from("ig_scheduled_posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as ScheduledIgPost;
}

export async function deleteScheduledPost(id: string): Promise<void> {
  const { error } = await supabase.from("ig_scheduled_posts").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Grupos de Hashtags (Supabase)
// ============================================================

export async function listHashtagGroups(): Promise<HashtagGroup[]> {
  const { data, error } = await supabase
    .from("ig_hashtag_groups")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []) as HashtagGroup[];
}

export async function createHashtagGroup(name: string, tags: string): Promise<HashtagGroup> {
  const { data, error } = await supabase
    .from("ig_hashtag_groups")
    .insert([{ name, tags }])
    .select("*")
    .single();

  if (error) throw error;
  return data as HashtagGroup;
}

export async function deleteHashtagGroup(id: string): Promise<void> {
  const { error } = await supabase.from("ig_hashtag_groups").delete().eq("id", id);
  if (error) throw error;
}

// ============================================================
// Endpoints Vercel (Meta Graph API)
// ============================================================

export async function getMetaOAuthUrl(): Promise<{ url: string; configured: boolean }> {
  const res = await apiFetch("/api/instagram/auth-url");
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Não foi possível gerar a URL de login da Meta.");
  return data;
}

export async function fetchLiveAccountFeed(accountId: string): Promise<{
  account: ConnectedIgAccount;
  media: LiveIgMedia[];
}> {
  const res = await apiFetch(`/api/instagram/feed?accountId=${encodeURIComponent(accountId)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao carregar feed do Instagram.");
  return data;
}

export async function fetchLiveMediaComments(
  accountId: string,
  mediaId: string
): Promise<LiveIgComment[]> {
  const res = await apiFetch(
    `/api/instagram/comments?accountId=${encodeURIComponent(accountId)}&mediaId=${encodeURIComponent(mediaId)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao carregar comentários.");
  return data.comments || [];
}

export async function replyToLiveComment(
  accountId: string,
  commentId: string,
  message: string
): Promise<{ id: string }> {
  const res = await apiFetch("/api/instagram/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId, commentId, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao responder comentário.");
  return data;
}

export async function publishPostNow(postId: string): Promise<{
  status: ScheduledPostStatus;
  results: PublishAccountResult[];
}> {
  const res = await apiFetch("/api/instagram/publish", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao publicar post no Instagram.");
  return data;
}

export interface LiveMediaStats {
  insights: {
    views: number | null;
    reach: number | null;
    saved: number | null;
    shares: number | null;
    total_interactions: number | null;
  };
  commentEnabled: boolean | null;
}

export async function fetchLiveMediaStats(accountId: string, mediaId: string): Promise<LiveMediaStats> {
  const res = await apiFetch(
    `/api/instagram/media?accountId=${encodeURIComponent(accountId)}&mediaId=${encodeURIComponent(mediaId)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Erro ao carregar estatísticas.");
  return data;
}

export async function setLiveMediaCommentsEnabled(
  accountId: string,
  mediaId: string,
  commentEnabled: boolean
): Promise<void> {
  const res = await apiFetch("/api/instagram/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId, mediaId, commentEnabled }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Não foi possível alterar os comentários.");
}
