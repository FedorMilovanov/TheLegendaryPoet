import BrandMark from './BrandMark';

export default function RouteLoadingShell() {
  return (
    <section
      className="mx-auto flex min-h-[68vh] w-full max-w-7xl flex-col justify-center px-4 pb-20 pt-28 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
      aria-label="Загрузка страницы"
    >
      <div className="relative overflow-hidden rounded-[2.25rem] border border-cyan-400/10 bg-[radial-gradient(circle_at_18%_20%,rgba(212,175,55,0.10),transparent_30%),radial-gradient(circle_at_82%_15%,rgba(0,212,255,0.08),transparent_32%),rgba(6,16,24,0.76)] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.34)] sm:p-9">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px overflow-hidden bg-white/[0.05]">
          <div className="h-full w-1/3 animate-[route-loading-line_1.6s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent motion-reduce:animate-none" />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-luxury-gold/15 bg-black/25">
            <BrandMark size="sm" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="h-2.5 w-28 animate-pulse rounded-full bg-luxury-gold/20 motion-reduce:animate-none" />
            <div className="mt-3 h-5 w-[min(24rem,82%)] animate-pulse rounded-full bg-white/[0.09] motion-reduce:animate-none" />
          </div>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3 rounded-3xl border border-white/[0.055] bg-black/15 p-5">
            {[92, 78, 86, 64].map((width, index) => (
              <div
                key={width}
                className="h-3 animate-pulse rounded-full bg-white/[0.065] motion-reduce:animate-none"
                style={{ width: `${width}%`, animationDelay: `${index * 90}ms` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="aspect-[1.3] animate-pulse rounded-3xl border border-cyan-400/[0.055] bg-cyan-400/[0.035] motion-reduce:animate-none"
                style={{ animationDelay: `${item * 110}ms` }}
              />
            ))}
          </div>
        </div>
        <span className="sr-only">Подготавливаем литературную страницу…</span>
      </div>
    </section>
  );
}
