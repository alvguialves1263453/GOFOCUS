import { executeScheduledPost, requireAdmin } from "./_meta.js";

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { postId } = req.body || {};
    if (!postId) {
      return res.status(400).json({ error: "postId é obrigatório." });
    }

    const result = await executeScheduledPost(postId);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Falha ao publicar no Instagram.",
    });
  }
}
