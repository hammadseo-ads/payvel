import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Buffer } from "buffer";

// Polyfill Buffer for Web3Auth
globalThis.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
