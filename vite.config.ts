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
      overrides: {
        // Force readable-stream to use our process polyfill
        process: 'process/browser',
      },
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
  },
  optimizeDeps: {
    exclude: [],
    include: [
      "process",
      "readable-stream",
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
        "process.nextTick": "globalThis.process.nextTick",
      },
      inject: [path.resolve(__dirname, "./src/polyfills/process.ts")],
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      defaultIsModuleExports: true,
      requireReturnsDefault: "preferred",
    },
  },
}));
