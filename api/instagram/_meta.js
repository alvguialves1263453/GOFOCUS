import { createClient } from "@supabase/supabase-js";

export const GRAPH_VERSION = "v21.0";
export const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

export function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Credenciais do Supabase ausentes no servidor. Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel."
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Só deixa passar quem está logado no painel admin (sessão do Supabase).
 * Devolve true se pode continuar; se não, já responde 401.
 */
export async function requireAdmin(req, res) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const token = typeof header === "string" && header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) {
    res.status(401).json({ error: "Faça login no painel para usar o IG Studio." });
    return false;
  }
  try {
    const { data, error } = await getSupabaseAdmin().auth.getUser(token);
    if (error || !data?.user) throw new Error("sessão inválida");
    return true;
  } catch {
    res.status(401).json({ error: "Sua sessão expirou. Entre no painel de novo." });
    return false;
  }
}

export function getAppBaseUrl(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const proto = req.headers["x-forwarded-proto"] || "https";
  const host = req.headers["x-forwarded-host"] || req.headers.host || "gofocusbr.vercel.app";
  return `${proto}://${host}`;
}

export async function graphFetch(path, { method = "GET", params = {}, body } = {}) {
  const url = new URL(path.startsWith("http") ? path : `${GRAPH_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }

  const init = { method, headers: {} };
  if (body) {
    init.headers["Content-Type"] = "application/x-www-form-urlencoded";
    const form = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null && v !== "") {
        form.set(k, String(v));
      }
    }
    init.body = form.toString();
  }

  const res = await fetch(url.toString(), init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.error) {
    const msg = data?.error?.error_user_msg || data?.error?.message || `Meta API HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function exchangeForLongLivedToken(shortToken) {
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return { access_token: shortToken, expires_in: 60 * 60 * 24 * 60 };
  }
  try {
    return await graphFetch("/oauth/access_token", {
      params: {
        grant_type: "fb_exchange_token",
        client_id: appId,
        client_secret: appSecret,
        fb_exchange_token: shortToken,
      },
    });
  } catch {
    return { access_token: shortToken, expires_in: 60 * 60 * 24 * 60 };
  }
}

export async function discoverAndSaveAccounts(accessToken, expiresInSeconds = 5184000) {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const igFields =
    "id,username,name,profile_picture_url,biography,followers_count,follows_count,media_count";
  const pageFields = `id,name,access_token,instagram_business_account{${igFields}},connected_instagram_account{${igFields}}`;

  const candidatePages = [];
  const seenPageIds = new Set();
  const addPage = (p) => {
    if (p?.id && !seenPageIds.has(String(p.id))) {
      seenPageIds.add(String(p.id));
      candidatePages.push(p);
    }
  };

  // 1. Standard /me/accounts
  try {
    const pagesRes = await graphFetch("/me/accounts", {
      params: { access_token: accessToken, fields: pageFields, limit: 50 },
    });
    for (const p of pagesRes.data || []) addPage(p);
  } catch {
    // continue to other discovery methods
  }

  // 2. If token is inside a Meta Business Portfolio (/me/businesses -> owned_pages & client_pages)
  try {
    const bizRes = await graphFetch("/me/businesses", {
      params: { access_token: accessToken, fields: "id,name", limit: 25 },
    });
    for (const biz of bizRes.data || []) {
      for (const edge of ["owned_pages", "client_pages"]) {
        try {
          const bp = await graphFetch(`/${biz.id}/${edge}`, {
            params: { access_token: accessToken, fields: pageFields, limit: 50 },
          });
          for (const p of bp.data || []) addPage(p);
        } catch {
          // ignore edge if permission missing
        }
      }
    }
  } catch {
    // ignore if business_management not granted
  }

  // 3. If user pasted a Page Access Token directly (/me is the Page itself)
  try {
    const mePage = await graphFetch("/me", {
      params: { access_token: accessToken, fields: pageFields },
    });
    if (mePage?.instagram_business_account || mePage?.connected_instagram_account) {
      addPage(mePage);
    }
  } catch {
    // ignore
  }

  const saved = [];
  const pagesWithoutIg = [];

  for (const page of candidatePages) {
    const ig = page.instagram_business_account || page.connected_instagram_account;
    if (!ig?.id) {
      pagesWithoutIg.push(page.name || page.id);
      continue;
    }

    const row = {
      ig_user_id: String(ig.id),
      username: ig.username || page.name || "instagram",
      name: ig.name || page.name || "",
      profile_picture_url: ig.profile_picture_url || "",
      biography: ig.biography || "",
      followers_count: ig.followers_count || 0,
      follows_count: ig.follows_count || 0,
      media_count: ig.media_count || 0,
      access_token: page.access_token || accessToken,
      token_expires_at: expiresAt,
      page_id: String(page.id),
      page_name: page.name || "",
      is_active: true,
      last_synced_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("ig_connected_accounts")
      .upsert(row, { onConflict: "ig_user_id" })
      .select(
        "id, ig_user_id, username, name, profile_picture_url, biography, followers_count, follows_count, media_count, token_expires_at, page_id, page_name, is_active, last_synced_at, created_at"
      )
      .single();

    if (error) throw error;
    saved.push(data);
  }

  // 4. Fallback: Direct Instagram API with Instagram Login (graph.instagram.com/me)
  if (saved.length === 0) {
    try {
      const igDirect = await graphFetch("https://graph.instagram.com/v21.0/me", {
        params: {
          access_token: accessToken,
          fields:
            "id,user_id,username,name,profile_picture_url,biography,followers_count,follows_count,media_count",
        },
      });
      if (igDirect?.id || igDirect?.user_id) {
        const igId = String(igDirect.user_id || igDirect.id);
        const row = {
          ig_user_id: igId,
          username: igDirect.username || "instagram",
          name: igDirect.name || igDirect.username || "",
          profile_picture_url: igDirect.profile_picture_url || "",
          biography: igDirect.biography || "",
          followers_count: igDirect.followers_count || 0,
          follows_count: igDirect.follows_count || 0,
          media_count: igDirect.media_count || 0,
          access_token: accessToken,
          token_expires_at: expiresAt,
          page_id: null,
          page_name: "Instagram Direct Login",
          is_active: true,
          last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await supabase
          .from("ig_connected_accounts")
          .upsert(row, { onConflict: "ig_user_id" })
          .select(
            "id, ig_user_id, username, name, profile_picture_url, biography, followers_count, follows_count, media_count, token_expires_at, page_id, page_name, is_active, last_synced_at, created_at"
          )
          .single();
        if (!error && data) saved.push(data);
      }
    } catch {
      // not an instagram.com direct token
    }
  }

  if (saved.length === 0) {
    if (pagesWithoutIg.length > 0) {
      throw new Error(
        `Encontramos a(s) Página(s) do Facebook (${pagesWithoutIg.join(", ")}), mas nenhuma conta do Instagram está vinculada a ela(s). Vincule o @gofocus.br à sua Página do Facebook ou adicione a permissão business_management no Graph API Explorer e gere o token novamente.`
      );
    }
    throw new Error(
      "O token não retornou nenhuma Página do Facebook nem conta do Instagram. No Graph API Explorer: (1) adicione também a permissão 'business_management', (2) clique em 'Generate Access Token' e (3) na janela que abrir, marque a sua Página do Facebook e a conta do Instagram @gofocus.br."
    );
  }

  return saved;
}

async function waitForContainerReady(creationId, accessToken, maxAttempts = 12) {
  for (let i = 0; i < maxAttempts; i++) {
    const statusRes = await graphFetch(`/${creationId}`, {
      params: {
        fields: "status_code,status",
        access_token: accessToken,
      },
    });
    const code = statusRes.status_code;
    if (code === "FINISHED" || code === "PUBLISHED" || !code) {
      return;
    }
    if (code === "ERROR" || code === "EXPIRED") {
      throw new Error(`Meta rejeitou o processamento da mídia (${statusRes.status || code}).`);
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error("Tempo limite aguardando o Instagram processar o vídeo/mídia.");
}

export function buildFinalCaption(caption, hashtags) {
  const c = (caption || "").trim();
  const h = (hashtags || "").trim();
  if (c && h) return `${c}\n\n${h}`;
  return c || h;
}

export async function publishPostToSingleAccount(account, post) {
  const token = account.access_token;
  const igUserId = account.ig_user_id;
  const urls = Array.isArray(post.media_urls) ? post.media_urls.filter(Boolean) : [];
  if (urls.length === 0) {
    throw new Error("Nenhuma mídia (foto ou vídeo) anexada ao agendamento.");
  }

  const finalCaption = buildFinalCaption(post.caption, post.hashtags);
  let creationId = "";

  if (post.media_type === "CAROUSEL" && urls.length > 1) {
    const childIds = [];
    for (const url of urls.slice(0, 10)) {
      const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(url);
      const child = await graphFetch(`/${igUserId}/media`, {
        method: "POST",
        body: {
          access_token: token,
          is_carousel_item: "true",
          ...(isVideo ? { media_type: "VIDEO", video_url: url } : { image_url: url }),
        },
      });
      if (isVideo) {
        await waitForContainerReady(child.id, token);
      }
      childIds.push(child.id);
    }

    const parent = await graphFetch(`/${igUserId}/media`, {
      method: "POST",
      body: {
        access_token: token,
        media_type: "CAROUSEL",
        children: childIds.join(","),
        caption: finalCaption,
      },
    });
    creationId = parent.id;
    await waitForContainerReady(creationId, token);
  } else if (post.media_type === "REELS") {
    const reel = await graphFetch(`/${igUserId}/media`, {
      method: "POST",
      body: {
        access_token: token,
        media_type: "REELS",
        video_url: urls[0],
        caption: finalCaption,
        share_to_feed: "true",
        ...(post.cover_url ? { cover_url: post.cover_url } : {}),
      },
    });
    creationId = reel.id;
    await waitForContainerReady(creationId, token, 20);
  } else if (post.media_type === "STORIES") {
    const isVideo = /\.(mp4|mov|webm)(\?|$)/i.test(urls[0]);
    const story = await graphFetch(`/${igUserId}/media`, {
      method: "POST",
      body: {
        access_token: token,
        media_type: "STORIES",
        ...(isVideo ? { video_url: urls[0] } : { image_url: urls[0] }),
      },
    });
    creationId = story.id;
    await waitForContainerReady(creationId, token, 15);
  } else {
    const img = await graphFetch(`/${igUserId}/media`, {
      method: "POST",
      body: {
        access_token: token,
        image_url: urls[0],
        caption: finalCaption,
      },
    });
    creationId = img.id;
    await waitForContainerReady(creationId, token, 6);
  }

  const published = await graphFetch(`/${igUserId}/media_publish`, {
    method: "POST",
    body: {
      access_token: token,
      creation_id: creationId,
    },
  });

  let permalink = "";
  try {
    const info = await graphFetch(`/${published.id}`, {
      params: { fields: "permalink", access_token: token },
    });
    permalink = info.permalink || "";
  } catch {
    // permalink optional
  }

  return {
    account_id: account.id,
    username: account.username,
    ok: true,
    ig_media_id: String(published.id),
    permalink,
    published_at: new Date().toISOString(),
  };
}

export async function executeScheduledPost(postId) {
  const supabase = getSupabaseAdmin();

  const { data: post, error: postErr } = await supabase
    .from("ig_scheduled_posts")
    .select("*")
    .eq("id", postId)
    .single();

  if (postErr || !post) {
    throw new Error("Post agendado não encontrado.");
  }

  const targetIds = Array.isArray(post.target_account_ids) ? post.target_account_ids : [];
  if (targetIds.length === 0) {
    throw new Error("Nenhuma conta de destino selecionada para esta postagem.");
  }

  await supabase
    .from("ig_scheduled_posts")
    .update({ status: "publicando", error_message: null, updated_at: new Date().toISOString() })
    .eq("id", postId);

  const { data: accounts, error: accErr } = await supabase
    .from("ig_connected_accounts")
    .select("*")
    .in("id", targetIds);

  if (accErr || !accounts?.length) {
    const msg = "Nenhuma das contas selecionadas está conectada no momento.";
    await supabase
      .from("ig_scheduled_posts")
      .update({ status: "erro", error_message: msg, updated_at: new Date().toISOString() })
      .eq("id", postId);
    throw new Error(msg);
  }

  const results = [];
  for (const account of accounts) {
    try {
      const res = await publishPostToSingleAccount(account, post);
      results.push(res);
    } catch (err) {
      results.push({
        account_id: account.id,
        username: account.username,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const allOk = results.every((r) => r.ok);
  const anyOk = results.some((r) => r.ok);
  const finalStatus = allOk ? "publicado" : anyOk ? "publicado" : "erro";
  const errorMsg = results
    .filter((r) => !r.ok)
    .map((r) => `@${r.username}: ${r.error}`)
    .join(" | ");

  await supabase
    .from("ig_scheduled_posts")
    .update({
      status: finalStatus,
      publish_results: results,
      error_message: errorMsg || null,
      published_at: anyOk ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", postId);

  return { status: finalStatus, results };
}
