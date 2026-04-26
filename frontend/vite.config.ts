/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

/**
 * Dev-only middleware: serve the SPA's transformed index.html for any GET
 * request whose path starts with /ludoteca. In production Caddy proxies
 * /ludoteca/* to the backend container, which already serves the SPA via
 * its catch-all route. Without this middleware, Vite's dev server would
 * 404 on /ludoteca/* requests because its base is /prestamos/.
 */
function serveLudotecaSpa(): Plugin {
  return {
    name: "serve-ludoteca-spa",
    apply: "serve",
    configureServer(server) {
      const indexHtmlPath = resolve(server.config.root, "index.html");
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? "";
        if (req.method !== "GET" || !url.startsWith("/ludoteca")) {
          return next();
        }
        if (url.includes(".") || url.startsWith("/ludoteca/api/")) {
          return next();
        }
        try {
          const raw = readFileSync(indexHtmlPath, "utf8");
          const html = await server.transformIndexHtml(url, raw);
          res.setHeader("content-type", "text/html");
          res.statusCode = 200;
          res.end(html);
        } catch (error) {
          next(error as Error);
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/prestamos/",
  plugins: [react(), serveLudotecaSpa()],
  server: {
    port: 5173,
    proxy: {
      "/prestamos/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/prestamos/, ""),
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
