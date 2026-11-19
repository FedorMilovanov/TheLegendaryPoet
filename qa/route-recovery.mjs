// Hold the real production resource. Keep intercepting subsequent attempts so
// a test can distinguish a stable visit, an explicit retry and a new document.
export async function withHeldRequest(context, pattern, respond, run) {
  const gate = Promise.withResolvers();
  let attempts = 0;
  await context.route(pattern, async route => {
    const n = ++attempts;
    if (n === 1) await gate.promise;
    await respond(route, n);
  });
  try { await run({ release: gate.resolve, attempts: () => attempts }); }
  finally { gate.resolve(); }
}

export const yesenin = '/essays/sergei-yesenin-1921-1925';
export const simonov = '/essays/simonov-syn-artillerista-realnaya-istoriya';
export const chapter = 'Когда Огонь Пришлось Перенести';
export const payload = `**/data${simonov}.json`;
export const unavailable = { status: 503, contentType: 'application/json', body: '{}' };
export const failOnce = response => (route, n) => n === 1 ? route.fulfill(response) : route.continue();
