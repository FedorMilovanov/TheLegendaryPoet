import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./audio-player.css";
import "./essay-motion.css";
import "./hover-stability.css";
import App from "./App";
import { preloadCurrentRoute } from "./routes/routeModules";

// All static imports, including the shared Link -> route registry cycle, have
// finished evaluating before this point. Warm the current deep-link chunk now,
// still before React mounts Suspense and begins the first render.
preloadCurrentRoute();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
