// @ts-check
import { defineConfig, envField } from 'astro/config';
import wix from '@wix/astro';
import react from "@astrojs/react";
import wixHostingAdapter from "@wix/astro-wix-hosting-adapter";

export default defineConfig({
  output: "server",
  adapter: wixHostingAdapter(),
  integrations: [wix(), react()],
  env: {
    schema: {
      LIFECYCLE_SHEETS_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      LIFECYCLE_SHEETS_WEBHOOK_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
      DEEPSEEK_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },
  image: { domains: ["static.wixstatic.com"] },
  security: { checkOrigin: false },
  devToolbar: { enabled: false },
  vite: {
    // Pre-bundle the lazily imported description editor at dev-server start. Discovering it
    // on first open re-optimizes deps mid-session and fails the import with "Outdated Optimize Dep".
    optimizeDeps: { include: ["react-quill-new"] },
    server: {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
      },
    },
  },
});
