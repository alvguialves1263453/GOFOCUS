import { getSupabaseAdmin, graphFetch, requireAdmin } from "./_meta.js";

// Estatísticas de um post (GET) e ativar/desativar comentários (POST).
const METRICS = ["views", "reach", "saved", "shares", "total_interactions"];

async function getAccount(accountId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("ig_connected_accounts")
    .select("access_token")
    .eq("id", accountId)
    .single();
  if (error || !data) return null;
  return data;
}

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  try {
    if (req.method === "GET") {
      const { accountId, mediaId } = req.query;
      if (!accountId || !mediaId) {
        return res.status(400).json({ error: "accountId e mediaId são obrigatórios." });
      }
      const account = await getAccount(accountId);
      if (!account) return res.status(404).json({ error: "Conta não encontrada." });

      // Cada métrica é pedida separada: se uma não existir para esse tipo de post, as outras continuam.
      const results = await Promise.all(
        METRICS.map(async (metric) => {
          try {
            const r = await graphFetch(`/${mediaId}/insights`, {
              params: { access_token: account.access_token, metric },
            });
            const v = r?.data?.[0]?.values?.[0]?.value ?? r?.data?.[0]?.total_value?.value;
            return [metric, typeof v === "number" ? v : null];
          } catch {
            return [metric, null];
          }
        })
      );

      let commentEnabled = null;
      try {
        const info = await graphFetch(`/${mediaId}`, {
          params: { access_token: account.access_token, fields: "comment_enabled" },
        });
        if (typeof info.comment_enabled === "boolean") commentEnabled = info.comment_enabled;
      } catch {
        // campo pode não estar disponível
      }

      return res.status(200).json({ insights: Object.fromEntries(results), commentEnabled });
    }

    if (req.method === "POST") {
      const { accountId, mediaId, commentEnabled } = req.body || {};
      if (!accountId || !mediaId || typeof commentEnabled !== "boolean") {
        return res.status(400).json({ error: "accountId, mediaId e commentEnabled são obrigatórios." });
      }
      const account = await getAccount(accountId);
      if (!account) return res.status(404).json({ error: "Conta não encontrada." });

      await graphFetch(`/${mediaId}`, {
        method: "POST",
        body: { access_token: account.access_token, comment_enabled: String(commentEnabled) },
      });
      return res.status(200).json({ ok: true, commentEnabled });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Erro ao carregar o post no Instagram.",
    });
  }
}
