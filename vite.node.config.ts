import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        injectRegister: null,
        devOptions: { enabled: false },
        strategies: "generateSW",
        filename: "sw.js",
        manifest: false,
        workbox: {
          navigateFallbackDenylist: [/^\/~oauth/],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.mode === "navigate",
              handler: "NetworkFirst",
              options: { cacheName: "elite-navigation", networkTimeoutSeconds: 4 },
            },
            {
              urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination === "image",
              handler: "CacheFirst",
              options: { cacheName: "elite-images", expiration: { maxEntries: 40, maxAgeSeconds: 604800 } },
            },
          ],
        },
      }),
    ],
  },
  nitro: { preset: "node-server" },
  tanstackStart: { server: { entry: "server" } },
});
