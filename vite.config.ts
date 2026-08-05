import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  server: {
    host: true, // bind 0.0.0.0 so Tailscale devices (phone/tablet) can reach it
    port: 8080,
    strictPort: true, // fail loudly instead of silently jumping to 8081 (would break firewall rule + phone bookmark)
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
