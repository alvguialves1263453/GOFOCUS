import { getSupabaseAdmin, graphFetch, requireAdmin } from "./_meta.js";

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { accountId } = req.query;
    if (!accountId) {
      return res.status(400).json({ error: "accountId é obrigatório." });
    }

    const supabase = getSupabaseAdmin();
    const { data: account, error } = await supabase
      .from("ig_connected_accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (error || !account) {
      return res.status(404).json({ error: "Conta não encontrada." });
    }

    const profile = await graphFetch(`/${account.ig_user_id}`, {
      params: {
        access_token: account.access_token,
        fields: "id,username,name,profile_picture_url,biography,followers_count,follows_count,media_count",
      },
    });

    const mediaRes = await graphFetch(`/${account.ig_user_id}/media`, {
      params: {
        access_token: account.access_token,
        fields:
          "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,children{id,media_type,media_url,thumbnail_url}",
        limit: 30,
      },
    });

    await supabase
      .from("ig_connected_accounts")
      .update({
        username: profile.username || account.username,
        name: profile.name || account.name,
        profile_picture_url: profile.profile_picture_url || account.profile_picture_url,
        biography: profile.biography || account.biography,
        followers_count: profile.followers_count ?? account.followers_count,
        follows_count: profile.follows_count ?? account.follows_count,
        media_count: profile.media_count ?? account.media_count,
        last_synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", account.id);

    const ownMedia = (mediaRes.data || []).map((item) => ({
      ...item,
      like_count: item.like_count ?? 0,
      comments_count: item.comments_count ?? 0,
      children: item.children?.data || [],
    }));

    // Posts em collab / em que a conta foi marcada (o dono é outra conta).
    let collabMedia = [];
    try {
      const tagsRes = await graphFetch(`/${account.ig_user_id}/tags`, {
        params: {
          access_token: account.access_token,
          fields:
            "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count,username,children{id,media_type,media_url,thumbnail_url}",
          limit: 30,
        },
      });
      const ownIds = new Set(ownMedia.map((m) => String(m.id)));
      collabMedia = (tagsRes.data || [])
        .filter((item) => !ownIds.has(String(item.id)))
        .map((item) => ({
          ...item,
          like_count: item.like_count ?? 0,
          comments_count: item.comments_count ?? 0,
          children: item.children?.data || [],
          is_collab: true,
          owner_username: item.username || "",
        }));
    } catch {
      // sem permissão ou sem posts marcados: segue só com os posts próprios
    }

    const media = [...ownMedia, ...collabMedia].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const { access_token: _omit, ...safeAccount } = {
      ...account,
      ...profile,
      last_synced_at: new Date().toISOString(),
    };

    return res.status(200).json({ account: safeAccount, media });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Erro ao sincronizar feed com a Meta.",
    });
  }
}
