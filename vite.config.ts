import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// API_PORT lets e2e run against a separate API instance.
const apiTarget = `http://localhost:${process.env.API_PORT ?? 4000}`

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "स्वावलंबी दीदी – लखपति अभिसरण पोर्टल",
        short_name: "लखपति दीदी",
        description: "सर्वे से स्थायी आय तक — हर परिवार की एक पहचान।",
        lang: "hi",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        theme_color: "#174e31",
        background_color: "#f6f7f3",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,jpg,svg,ico,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "google-fonts-stylesheets" },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: Number(process.env.VITE_PORT ?? 5173),
    proxy: { "/api": apiTarget },
  },
  preview: {
    proxy: { "/api": apiTarget },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
})
