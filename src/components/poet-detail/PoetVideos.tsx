import type { Poet } from '../../types/poet';

export default function PoetVideos({ poet }: { poet: Poet }) {
  return (
    <>
            {poet.videos && poet.videos.length > 0 && (
              <section aria-labelledby="poet-videos-heading" className="theme-elevated-surface rounded-[2rem] border p-6 shadow-[0_12px_40px_rgba(0,0,0,.18)] md:p-9">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <h2 id="poet-videos-heading" className="theme-text font-serif text-3xl">Видео — <span className="theme-poet-accent">The Legendary Poet</span></h2>
                  {poet.links?.youtube && (
                    <a href={poet.links.youtube} target="_blank" rel="noopener noreferrer" className="theme-poet-accent rounded-full border border-luxury-gold/30 px-4 py-2 text-xs font-semibold transition hover:border-luxury-gold/70">
                      Открыть подборку на YouTube ↗
                    </a>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {poet.videos.map((video) => {
                    const scheduled = Boolean(video.availableFrom && new Date(video.availableFrom).getTime() > Date.now());
                    if (scheduled) {
                      return (
                        <article key={video.youtubeId} className="theme-soft-surface rounded-xl border p-5">
                          <span className="theme-functional-muted mb-3 block text-[10px] font-bold uppercase tracking-widest">YouTube · Ожидает выхода</span>
                          <span className="theme-text font-serif text-lg">{video.title}</span>
                          <span className="theme-functional-muted mt-2 block text-xs">Ссылка появится после публикации</span>
                        </article>
                      );
                    }
                    return (
                      <a key={video.youtubeId} href={"https://www.youtube.com/watch?v=" + video.youtubeId} target="_blank" rel="noopener noreferrer" className="theme-soft-surface group rounded-xl border p-5 transition hover:border-luxury-gold/40">
                        <span className="theme-functional-muted mb-3 block text-[10px] font-bold uppercase tracking-widest">YouTube · {scheduled ? 'Ожидает выхода' : 'Смотреть видео'}</span>
                        <span className="theme-text font-serif text-lg transition group-hover:underline">{video.title}</span>
                        <span className="theme-functional-muted mt-2 block text-xs">Канал The Legendary Poet ↗</span>
                      </a>
                    );
                  })}
                </div>
                <p className="theme-functional-muted mt-5 text-xs leading-relaxed">Оживление архивных изображений — современная художественная реконструкция, не историческая видеозапись.</p>
              </section>
            )}
    </>
  );
}
