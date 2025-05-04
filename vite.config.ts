import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  base: mode === "production" ? "/billit/" : "/",
  resolve: {
    alias: {
      html2canvas: path.resolve(__dirname, "node_modules/html2canvas-pro"),
    },
  },
}));
