import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { cjsInterop } from "vite-plugin-cjs-interop";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    nodePolyfills({
      include: ["buffer", "process", "assert", "crypto", "stream", "util"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
    cjsInterop({
      dependencies: [
        "enc-utils",
        "elliptic",
        "bn.js",
        "@toruslabs/starkware-crypto",
      ],
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
    },
    dedupe: ["enc-utils", "elliptic", "bn.js", "@toruslabs/starkware-crypto"],
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: [
      "enc-utils",
      "bn.js",
      "elliptic",
      "hash.js",
      "hmac-drbg",
      "brorand",
      "minimalistic-assert",
      "minimalistic-crypto-utils",
      "inherits",
      "safe-buffer",
    ],
    exclude: [
      "@web3auth/modal",
      "@web3auth/base",
      "@web3auth/no-modal",
      "@web3auth/auth",
      "@toruslabs/openlogin",
      "@toruslabs/openlogin-jrpc",
      "@toruslabs/openlogin-utils",
      "@toruslabs/starkware-crypto",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
}));
