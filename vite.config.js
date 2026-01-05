import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue"; // Pastikan ini '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // Ini adalah bagian yang memperbaiki error '@/' tidak ditemukan
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
