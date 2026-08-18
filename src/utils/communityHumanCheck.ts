import {
  communityTestHumanProof,
  communityTurnstileSiteKey,
  remoteEnabled,
} from './communityConfig';

type TurnstileRenderOptions = {
  sitekey: string;
  execution: 'execute';
  appearance: 'interaction-only';
  theme: 'dark';
  language: 'ru';
  action: 'community_session';
  callback: (token: string) => void;
  'error-callback': () => void;
  'expired-callback': () => void;
  'timeout-callback': () => void;
  'unsupported-callback': () => void;
};

type TurnstileApi = {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  execute(widget: string | HTMLElement): void;
  remove(widget: string): void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_ID = 'tlp-turnstile-script';
const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
const PROOF_TIMEOUT_MS = 45_000;
let scriptPromise: Promise<TurnstileApi | null> | null = null;
let proofPromise: Promise<string | null> | null = null;

function getTurnstile() {
  return typeof window !== 'undefined' ? window.turnstile ?? null : null;
}

function loadTurnstile(): Promise<TurnstileApi | null> {
  const existing = getTurnstile();
  if (existing) return Promise.resolve(existing);
  if (scriptPromise) return scriptPromise;
  if (typeof document === 'undefined') return Promise.resolve(null);

  scriptPromise = new Promise((resolve) => {
    const finish = () => resolve(getTurnstile());
    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', finish, { once: true });
      existingScript.addEventListener('error', () => resolve(null), { once: true });
      window.setTimeout(finish, 5000);
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = SCRIPT_URL;
    script.defer = true;
    script.async = true;
    script.onload = finish;
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  }).finally(() => {
    if (!getTurnstile()) scriptPromise = null;
  });

  return scriptPromise;
}

async function obtainProof() {
  if (!remoteEnabled) return null;
  if (communityTestHumanProof) return communityTestHumanProof;
  const sitekey = communityTurnstileSiteKey;
  if (!sitekey || typeof document === 'undefined') return null;
  const turnstile = await loadTurnstile();
  if (!turnstile) return null;

  return new Promise<string | null>((resolve) => {
    const container = document.createElement('div');
    container.setAttribute('data-community-turnstile', 'true');
    container.style.position = 'fixed';
    container.style.right = '16px';
    container.style.bottom = '16px';
    container.style.zIndex = '2147483646';
    container.style.maxWidth = 'calc(100vw - 32px)';
    document.body.appendChild(container);

    let widgetId = '';
    let settled = false;
    const timer = window.setTimeout(() => finish(null), PROOF_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timer);
      if (widgetId) {
        try { turnstile.remove(widgetId); } catch { /* widget already gone */ }
      }
      container.remove();
    };
    const finish = (token: string | null) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(token && token.length <= 2048 ? token : null);
    };

    try {
      widgetId = turnstile.render(container, {
        sitekey,
        execution: 'execute',
        appearance: 'interaction-only',
        theme: 'dark',
        language: 'ru',
        action: 'community_session',
        callback: (token) => finish(token),
        'error-callback': () => finish(null),
        'expired-callback': () => finish(null),
        'timeout-callback': () => finish(null),
        'unsupported-callback': () => finish(null),
      });
      turnstile.execute(widgetId);
    } catch {
      finish(null);
    }
  });
}

export function requestCommunityHumanProof(): Promise<string | null> {
  if (proofPromise) return proofPromise;
  proofPromise = obtainProof().finally(() => {
    proofPromise = null;
  });
  return proofPromise;
}
