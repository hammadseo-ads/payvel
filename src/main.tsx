// ============================================
// CRITICAL: Import polyfills FIRST
// ============================================
import processShim from "process/browser";
import { Buffer } from "buffer";
import EventEmitter from "events";

// Global assignments (must happen before other imports)
(globalThis as any).global = globalThis;
(globalThis as any).Buffer = Buffer;
(globalThis as any).process = processShim;
(globalThis as any).EventEmitter = EventEmitter;

console.log("✅ Polyfills loaded:", {
  hasProcess: !!(globalThis as any).process,
  hasNextTick: typeof (globalThis as any).process?.nextTick === "function",
  hasBuffer: !!(globalThis as any).Buffer,
  hasEventEmitter: typeof EventEmitter === "function",
});

// NOW import application code
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { bootstrapWeb3Auth } from "./lib/web3auth-bootstrap";

// Initialize Web3Auth BEFORE React mounts
bootstrapWeb3Auth()
  .then(() => {
    console.log("✅ Web3Auth ready, mounting React...");
    createRoot(document.getElementById("root")!).render(<App />);
  })
  .catch((error) => {
    console.error("❌ Failed to bootstrap Web3Auth:", error);
    // Still mount React so user can see error
    createRoot(document.getElementById("root")!).render(<App />);
  });
