import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    ssr: false, // 👈 This tells the plugin to build an SPA instead of an SSR Worker
  },
});