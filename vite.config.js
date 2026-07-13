import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // Relative asset paths allow deployment below an IIS virtual directory.
  base: "./",
  plugins: [react()],
  build: {
    outDir: "dist/client",
    emptyOutDir: true
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
      "/data": "http://localhost:3000"
    }
  }
});
