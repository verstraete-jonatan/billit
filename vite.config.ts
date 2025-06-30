import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";
import { type Plugin } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  base: mode === "production" ? "/billit" : "/",
  resolve: {
    alias: {
      html2canvas: path.resolve(__dirname, "node_modules/html2canvas-pro"),
    },
  },
}));

export function replaceOklabPlugin(): Plugin {
  return {
    name: "replace-oklab",
    enforce: "post", // run after other plugins

    transform(code, id) {
      // Only process CSS files
      if (!id.endsWith(".css")) return null;

      if (code.includes("oklab(")) {
        const replaced = code.replace(/oklab\([^)]+\)/g, "rgb(0,0,0)");
        return {
          code: replaced,
          map: null,
        };
      }

      return null;
    },
  };
}
