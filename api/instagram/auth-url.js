import { getAppBaseUrl, requireAdmin } from "./_meta.js";

const SCOPES = [
  "instagram_basic",
  "instagram_content_publish",
  "instagram_manage_comments",
  "instagram_manage_insights",
  "pages_show_list",
  "pages_read_engagement",
  "business_management",
].join(",");

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const appId = process.env.META_APP_ID;
  if (!appId) {
    return res.status(200).json({
      configured: false,
      url: "",
      message: "Configure META_APP_ID e META_APP_SECRET nas variáveis de ambiente da Vercel.",
    });
  }

  const redirectUri = `${getAppBaseUrl(req)}/api/instagram/callback`;
  const authUrl = new URL("https://www.facebook.com/v21.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", "gofocus_ig_studio");

  return res.status(200).json({
    configured: true,
    url: authUrl.toString(),
    redirectUri,
  });
}
