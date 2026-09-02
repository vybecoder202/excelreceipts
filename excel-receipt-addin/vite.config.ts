import { getHttpsServerOptions } from "office-addin-dev-certs";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(async () => ({
  base: process.env.GITHUB_PAGES === "true" ? "/excelreceipts/" : "/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    https: await getHttpsServerOptions()
  },
  build: {
    outDir: "dist",
    sourcemap: true
  }
}));
