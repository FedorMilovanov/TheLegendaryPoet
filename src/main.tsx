import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./audio-player.css";
import "./essay-motion.css";
import "./hover-stability.css";
import "./overlay-chrome.css";
import App from "./App";
import { preloadCurrentRoute } from "./routes/routeModules";

async function mountApp() {
  // Resolve the first route module before React mounts. On cold WebKit runs this
  // prevents the deep-link page from sitting behind Suspense while the module
  // graph is still being evaluated. Later navigations remain lazy-loaded.
  await preloadCurrentRoute();

  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void mountApp();
