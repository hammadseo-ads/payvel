import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
    },
    dedupe: ['react', 'react-dom'],
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    exclude: ['@web3auth/modal', '@web3auth/base', '@web3auth/no-modal', '@web3auth/auth', '@toruslabs/starkware-crypto'],
    include: ['bn.js'],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
}));
