
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      devOptions: {
        enabled: false,
      
      },

      registerType: "autoUpdate",
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
      },
      includeAssets: [
        "favicon-32x32.png",
        "favicon-16x16.png",
        "apple-touch-icon.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "pwa-maskable-512x512.png",
      ],
      manifest: {
        name: "SurDrive",
        short_name: "SurDrive",
        description: "SurDrive - your files, always with you",
        theme_color: "#000000",
        background_color: "#000000",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        screenshots: [
          {
            src: "screenshots/desktop.png",
            sizes: "1280x800",
            type: "image/png",
            form_factor: "wide",
          },
          {
            src: "screenshots/mobile.png",
            sizes: "750x1334",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
