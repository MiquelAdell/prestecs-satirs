import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  // Disable publicDir so Vite doesn't try to copy public/ into the outDir
  // (which would recurse since outDir lives inside public/).
  publicDir: false,
  build: {
    lib: {
      entry: "src/site-shell-embed.tsx",
      name: "SiteShell",
      formats: ["iife"],
    },
    outDir: "public/content-mirror/_assets",
    emptyOutDir: false,
    rollupOptions: {
      output: {
        entryFileNames: "site-shell.js",
      },
    },
  },
});
