import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const envAllowedHosts = (process.env.VITE_ALLOWED_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    },
    allowedHosts: [
      "localhost",
      "127.0.0.1",
      ".ngrok-free.app",
      ".ngrok-free.dev",
      "ok-faultier-izetta.ngrok-free.dev",
      ".ngrok.io",
      ...envAllowedHosts
    ]
  }
});
