import { executeScheduledPost, getSupabaseAdmin } from "./_meta.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // A Vercel manda "Authorization: Bearer <CRON_SECRET>" sozinha quando a variável CRON_SECRET existe.
  // Sem CRON_SECRET configurado, ninguém pode disparar a publicação por fora.
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabase = getSupabaseAdmin();
    const nowIso = new Date().toISOString();

    const { data: duePosts, error } = await supabase
      .from("ig_scheduled_posts")
      .select("id, title, scheduled_for")
      .eq("status", "agendado")
      .lte("scheduled_for", nowIso)
      .order("scheduled_for", { ascending: true })
      .limit(10);

    if (error) throw error;

    const processed = [];
    for (const post of duePosts || []) {
      try {
        const result = await executeScheduledPost(post.id);
        processed.push({ id: post.id, title: post.title, ...result });
      } catch (err) {
        processed.push({
          id: post.id,
          title: post.title,
          status: "erro",
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return res.status(200).json({
      checkedAt: nowIso,
      processedCount: processed.length,
      processed,
    });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : "Erro ao executar cron de agendamento.",
    });
  }
}
