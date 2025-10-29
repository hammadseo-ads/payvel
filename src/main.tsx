import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Buffer } from "buffer";
import { bootstrapWeb3Auth } from "./lib/web3auth-bootstrap";

// Polyfill Buffer for Web3Auth - multiple assignments for maximum compatibility
globalThis.Buffer = Buffer;
window.Buffer = Buffer;

// Polyfill process.nextTick (critical for Web3Auth)
if (!window.process) {
  window.process = { env: {} } as any;
}
if (!window.process.nextTick) {
  window.process.nextTick = function(callback: Function, ...args: any[]) {
    setTimeout(() => callback(...args), 0);
  };
}

console.log("✅ Polyfills loaded:", {
  hasBuffer: !!window.Buffer,
  hasProcess: !!window.process,
  hasNextTick: !!(window.process && window.process.nextTick)
});

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
