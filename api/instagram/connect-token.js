import { discoverAndSaveAccounts, exchangeForLongLivedToken, requireAdmin } from "./_meta.js";

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { accessToken } = req.body || {};
    if (!accessToken || typeof accessToken !== "string") {
      return res.status(400).json({ error: "Informe um Access Token válido da Meta." });
    }

    const longRes = await exchangeForLongLivedToken(accessToken.trim());
    const accounts = await discoverAndSaveAccounts(
      longRes.access_token || accessToken.trim(),
      longRes.expires_in || 5184000
    );

    return res.status(200).json({ accounts });
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : "Erro ao validar token na Meta Graph API.",
    });
  }
}
