import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme.css";
import "./audio-player.css";
import "./essay-motion.css";
import "./hover-stability.css";
import "./reduced-motion.css";
import App, { skipIntroForPreparedPoem } from "./App";
import { prepareInitialPoemRoute } from "./routes/routeModules";

const root = document.getElementById("root")!;
function mount() {
  createRoot(root).render(<StrictMode><App /></StrictMode>);
}

async function start() {
  const staticPage = root.querySelector<HTMLElement>(':scope > main[data-poem-static-path]');
  if (!staticPage) { mount(); return; }
  const abort = new AbortController();
  let timer: number | undefined;
  try {
    if (!__TLP_HAS_APPROVED_POEM_PAGES__) throw new Error('No approved standalone poem routes in this build');
    const path = staticPage.dataset.poemStaticPath ?? '';
    const workId = staticPage.querySelector<HTMLElement>('[data-poem-reading-page]')?.dataset.poemReadingPage ?? '';
    const base = import.meta.env.BASE_URL.replace(/\/$/, '');
    const pathname = window.location.pathname.slice(base.length);
    const snapshot = {
      path, workId,
      heading: staticPage.querySelector('h1')?.textContent ?? '',
      text: staticPage.querySelector('[data-poem-canonical]')?.textContent ?? '',
      analysis: staticPage.querySelector('[data-poem-analysis]')?.textContent ?? '',
    };
    if (!window.location.pathname.startsWith(base + '/') || (pathname !== path && pathname + '/' !== path)) {
      throw new Error('Initial poem path mismatch');
    }
    const deadline = new Promise<never>((_, reject) => {
      timer = window.setTimeout(() => { abort.abort(); reject(new Error('Initial poem load timed out')); }, 12000);
    });
    await Promise.race([prepareInitialPoemRoute(snapshot, abort.signal), deadline]);
    skipIntroForPreparedPoem();
    mount();
  } catch {
    // The complete, already delivered reading document is still usable.
    // Never replace it with a blank screen or retry loop.
    abort.abort();
    const notice = document.createElement('p');
    notice.className = 'theme-functional-muted mx-auto max-w-4xl px-4 py-4 text-sm';
    notice.setAttribute('role', 'status');
    notice.textContent = 'Интерактивные функции не загрузились. Текст доступен для чтения. ';
    const retry = document.createElement('a');
    retry.href = window.location.href;
    retry.className = 'underline';
    retry.textContent = 'Повторить загрузку';
    notice.append(retry);
    staticPage.append(notice);
  } finally {
    if (timer !== undefined) window.clearTimeout(timer);
  }
}
void start();
