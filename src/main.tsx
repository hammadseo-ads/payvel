// Minimal polyfill imports
import './polyfills/process';
import { Buffer } from "buffer";

// Basic global assignments
(globalThis as any).global = globalThis;
(globalThis as any).Buffer = Buffer;

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
