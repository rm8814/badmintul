import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Static SPA build only (no SSR) — required for Hostinger shared hosting (SPEC.md §2, RISKS.md R-1).
export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    includeAssets: ['pwa-icon-192.svg', 'pwa-icon-512.svg'],
    manifest: {
      name: 'badmintul.com', short_name: 'badmintul', description: 'Find and book badminton courts.',
      theme_color: '#7c3aed', background_color: '#fafafa', display: 'standalone', start_url: '/',
      icons: [
        { src: '/pwa-icon-192.svg', sizes: '192x192', type: 'image/svg+xml' },
        { src: '/pwa-icon-512.svg', sizes: '512x512', type: 'image/svg+xml' },
      ],
    },
    workbox: { globPatterns: ['**/*.{js,css,html,svg,png,ico}'] },
  })],
})
