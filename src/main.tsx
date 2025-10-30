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

// Ensure nextTick is truly present with microtask fallback
if (typeof (globalThis as any).process.nextTick !== "function") {
  console.warn("⚠️ nextTick missing, adding microtask polyfill");
  (globalThis as any).process.nextTick = (cb: Function, ...args: any[]) =>
    Promise.resolve().then(() => cb(...args));
}

console.log("✅ Polyfills loaded:", {
  hasProcess: !!(globalThis as any).process,
  hasNextTick: typeof (globalThis as any).process?.nextTick === "function",
  hasBuffer: !!(globalThis as any).Buffer,
  hasEventEmitter: typeof EventEmitter === "function",
});

// CRITICAL: Verify process.nextTick before proceeding
if (typeof (globalThis as any).process?.nextTick !== "function") {
  console.error("❌ CRITICAL: process.nextTick still not available!");
  alert("App initialization error. Please refresh the page.");
  throw new Error("process.nextTick polyfill failed");
}

// Test that it actually works
try {
  (globalThis as any).process.nextTick(() => {
    console.log("✅ process.nextTick test successful");
  });
} catch (error) {
  console.error("❌ process.nextTick test failed:", error);
}

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
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    // Still mount React so user can see error
    createRoot(document.getElementById("root")!).render(<App />);
  });
