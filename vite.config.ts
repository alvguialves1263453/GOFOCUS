import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import fs from "node:fs";
import { pathToFileURL } from "node:url";

/** Runs Vercel-style /api/instagram/*.js handlers locally during `vite` dev. */
function localInstagramApiPlugin(env: Record<string, string>): Plugin {
  return {
    name: "local-instagram-api",
    configureServer(server) {
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) {
          process.env[k] = v;
        }
      }

      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith("/api/instagram/")) {
          return next();
        }

        const parsedUrl = new URL(req.url, "http://localhost:8080");
        const endpoint = parsedUrl.pathname.replace(/^\/api\/instagram\//, "").replace(/\/$/, "");
        if (!endpoint || endpoint.startsWith("_") || endpoint.includes("..")) {
          return next();
        }

        const filePath = path.resolve(__dirname, "api", "instagram", `${endpoint}.js`);
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: `Endpoint /api/instagram/${endpoint} não encontrado.` }));
          return;
        }

        try {
          const query: Record<string, string> = {};
          parsedUrl.searchParams.forEach((v, k) => {
            query[k] = v;
          });

          let body: Record<string, unknown> = {};
          if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }
            const raw = Buffer.concat(chunks).toString("utf8");
            if (raw) {
              try {
                body = JSON.parse(raw);
              } catch {
                body = {};
              }
            }
          }

          const modUrl = `${pathToFileURL(filePath).href}?t=${Date.now()}`;
          const mod = await import(modUrl);
          const handler = mod.default;

          const apiReq = Object.assign(req, { query, body });
          const apiRes = Object.assign(res, {
            status(code: number) {
              res.statusCode = code;
              return apiRes;
            },
            json(payload: unknown) {
              res.setHeader("Content-Type", "application/json; charset=utf-8");
              res.end(JSON.stringify(payload));
              return apiRes;
            },
            redirect(location: string) {
              res.statusCode = 302;
              res.setHeader("Location", location);
              res.end();
              return apiRes;
            },
          });

          await handler(apiReq, apiRes);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(
            JSON.stringify({
              error: err instanceof Error ? err.message : "Erro interno na API local.",
            })
          );
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), localInstagramApiPlugin(env)].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            ui: ["lucide-react", "framer-motion", "sonner"],
          },
        },
      },
    },
  };
});
