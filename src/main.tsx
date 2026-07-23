import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./essay-motion.css";
import "./essay-media-runtime.css";
import "./media-stability.css";
import "./ambient-performance.css";
import "./reduced-motion.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
