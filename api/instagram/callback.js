import {
  discoverAndSaveAccounts,
  exchangeForLongLivedToken,
  getAppBaseUrl,
  graphFetch,
} from "./_meta.js";

export default async function handler(req, res) {
  const baseUrl = getAppBaseUrl(req);
  const { code, error, error_description } = req.query;

  if (error) {
    return res.redirect(
      `${baseUrl}/admin/instagram-studio?error=${encodeURIComponent(error_description || error)}`
    );
  }

  if (!code) {
    return res.redirect(
      `${baseUrl}/admin/instagram-studio?error=${encodeURIComponent("Código OAuth ausente.")}`
    );
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    if (!appId || !appSecret) {
      throw new Error("META_APP_ID ou META_APP_SECRET não configurados na Vercel.");
    }

    const redirectUri = `${baseUrl}/api/instagram/callback`;
    const shortRes = await graphFetch("/oauth/access_token", {
      params: {
        client_id: appId,
        client_secret: appSecret,
        redirect_uri: redirectUri,
        code,
      },
    });

    const longRes = await exchangeForLongLivedToken(shortRes.access_token);
    const saved = await discoverAndSaveAccounts(
      longRes.access_token || shortRes.access_token,
      longRes.expires_in || 5184000
    );

    return res.redirect(`${baseUrl}/admin/instagram-studio?connected=${saved.length}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro ao conectar conta do Instagram.";
    return res.redirect(`${baseUrl}/admin/instagram-studio?error=${encodeURIComponent(msg)}`);
  }
}
