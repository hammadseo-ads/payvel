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
    nodePolyfills({
      include: ["buffer", "process", "assert", "crypto", "stream", "util", "events"],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
    react(),
    cjsInterop({
      dependencies: [
        "enc-utils",
        "elliptic",
        "bn.js",
        "@toruslabs/starkware-crypto",
        "bip39",
        "loglevel",
        "deepmerge",
        "cipher-base",
        "randombytes",
        "browserify-aes",
        "base64url",
        "hash.js",
        "hmac-drbg",
        "brorand",
        "minimalistic-assert",
        "minimalistic-crypto-utils",
        "inherits",
        "safe-buffer",
        "create-hash",
        "pbkdf2",
        "sha.js",
        "ripemd160",
        "events",
      ],
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer/",
      process: path.resolve(__dirname, "./src/polyfills/process.ts"),
      "process/": "process/browser",
      stream: "stream-browserify",
      util: "util/",
      events: "events/",
    },
    dedupe: ["react", "react-dom", "enc-utils", "elliptic", "bn.js", "@toruslabs/starkware-crypto", "bip39", "loglevel", "deepmerge", "cipher-base", "randombytes", "base64url", "events", "process", "stream-browserify", "util"],
    conditions: ["module", "import", "browser", "default"],
  },
  define: {
    global: "globalThis",
    'global.process': 'window.process',
    'globalThis.process': 'window.process',
  },
  optimizeDeps: {
    exclude: [],
    include: [
      "process",
      "readable-stream",
      "readable-stream/lib/_stream_readable",
      "readable-stream/lib/_stream_writable",
      "readable-stream/lib/_stream_duplex",
      "@web3auth/auth",
      "buffer",
      "events",
      "stream-browserify",
      "util",
      "react",
      "react-dom",
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
      "bip39",
      "create-hash",
      "pbkdf2",
      "sha.js",
      "ripemd160",
      "loglevel",
      "deepmerge",
      "cipher-base",
      "randombytes",
      "browserify-aes",
      "base64url",
      "@web3auth/no-modal",
      "@web3auth/base",
      "@toruslabs/customauth",
      "@toruslabs/http-helpers",
      "@toruslabs/openlogin",
      "@toruslabs/openlogin-jrpc",
      "@toruslabs/openlogin-utils",
    ],
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
      inject: [path.resolve(__dirname, "./src/polyfills/process.ts")],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Force process polyfill into main chunk to ensure single instance
          if (id.includes('process') || id.includes('polyfills/process')) {
            return 'main';
          }
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
      requireReturnsDefault: "preferred",
    },
  },
}));
