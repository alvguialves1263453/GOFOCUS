import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

const server = await createServer({
  configFile: path.join(root, "vite.config.ts"),
  root,
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
  },
});

await server.listen();
server.printUrls();