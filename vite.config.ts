import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      // Proxy para Slack — evita CORS en desarrollo local
      '/slack-proxy': {
        target: 'https://hooks.slack.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/slack-proxy/, ''),
        secure: true,
      },
      '/.netlify/functions': {
        target: 'http://localhost:8888',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/\.netlify\/functions/, ''),
      },
    },
  },
})
