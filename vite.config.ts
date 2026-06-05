import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// tempo-devtools integration removed for build stability when package is absent

// https://vitejs.dev/config/
export default defineConfig({
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            "react-vendor": ["react", "react-dom", "react-router-dom"],
            "ui-vendor": ["@radix-ui/react-accordion", "@radix-ui/react-select"],
            "utils-vendor": ["clsx", "tailwind-merge", "lucide-react"],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    base:
      process.env.NODE_ENV === "development"
        ? "/"
        : process.env.VITE_BASE_PATH || "/",
    optimizeDeps: {
      entries: ["src/main.tsx", "src/tempobook/**/*"],
    },
    plugins: [react()],
    resolve: {
      preserveSymlinks: true,
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      // @ts-ignore
      allowedHosts: true,
    },
  });
