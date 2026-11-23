import { getSupabaseAdmin, graphFetch, requireAdmin } from "./_meta.js";

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  try {
    const supabase = getSupabaseAdmin();

    if (req.method === "GET") {
      const { accountId, mediaId } = req.query;
      if (!accountId || !mediaId) {
        return res.status(400).json({ error: "accountId e mediaId são obrigatórios." });
      }

      const { data: account, error } = await supabase
        .from("ig_connected_accounts")
        .select("access_token")
        .eq("id", accountId)
        .single();

      if (error || !account) {
        return res.status(404).json({ error: "Conta não encontrada." });
      }

      const commentsRes = await graphFetch(`/${mediaId}/comments`, {
        params: {
          access_token: account.access_token,
          fields: "id,text,username,timestamp,like_count,replies{id,text,username,timestamp,like_count}",
          limit: 50,
        },
      });

      const comments = (commentsRes.data || []).map((c) => ({
        ...c,
        replies: c.replies?.data || [],
      }));

      return res.status(200).json({ comments });
    }

    if (req.method === "POST") {
      const { accountId, commentId, message } = req.body || {};
      if (!accountId || !commentId || !message?.trim()) {
        return res.status(400).json({ error: "accountId, commentId e message são obrigatórios." });
      }

      const { data: account, error } = await supabase
        .from("ig_connected_accounts")
        .select("access_token")
        .eq("id", accountId)
        .single();

      if (error || !account) {
        return res.status(404).json({ error: "Conta não encontrada." });
      }

      const reply = await graphFetch(`/${commentId}/replies`, {
        method: "POST",
        body: {
          access_token: account.access_token,
          message: message.trim(),
        },
      });

      return res.status(200).json({ id: reply.id });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Erro ao processar comentários no Instagram.",
    });
  }
}
