import type { Poet } from '../../types/poet';

export default function PoetVideos({ poet }: { poet: Poet }) {
  return (
    <>
            {poet.videos && poet.videos.length > 0 && (
              <section aria-labelledby="poet-videos-heading" className="rounded-[2rem] border border-cyan-400/15 bg-gradient-to-br from-[#07121b] to-[#090908] p-6 shadow-[0_12px_40px_rgba(0,0,0,.18)] md:p-9">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                  <h2 id="poet-videos-heading" className="font-serif text-3xl text-white">Видео — <span className="text-cyan-300">The Legendary Poet</span></h2>
                  {poet.links?.youtube && (
                    <a href={poet.links.youtube} target="_blank" rel="noopener noreferrer" className="rounded-full border border-luxury-gold/30 px-4 py-2 text-xs font-semibold text-luxury-gold transition hover:border-luxury-gold/70">
                      Открыть подборку на YouTube ↗
                    </a>
                  )}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {poet.videos.map((video) => {
                    const scheduled = Boolean(video.availableFrom && new Date(video.availableFrom).getTime() > Date.now());
                    if (scheduled) {
                      return (
                        <article key={video.youtubeId} className="rounded-xl border border-white/10 bg-black/30 p-5">
                          <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">YouTube · Ожидает выхода</span>
                          <span className="font-serif text-lg text-white">{video.title}</span>
                          <span className="mt-2 block text-xs text-cyan-200/50">Ссылка появится после публикации</span>
                        </article>
                      );
                    }
                    return (
                      <a key={video.youtubeId} href={"https://www.youtube.com/watch?v=" + video.youtubeId} target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-white/10 bg-black/30 p-5 transition hover:border-cyan-400/35 hover:bg-cyan-900/10">
                        <span className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-cyan-400/70">YouTube · {scheduled ? 'Ожидает выхода' : 'Смотреть видео'}</span>
                        <span className="font-serif text-lg text-white transition group-hover:text-cyan-200">{video.title}</span>
                        <span className="mt-2 block text-xs text-cyan-200/50">Канал The Legendary Poet ↗</span>
                      </a>
                    );
                  })}
                </div>
                <p className="mt-5 text-xs leading-relaxed text-cyan-100/50">Оживление архивных изображений — современная художественная реконструкция, не историческая видеозапись.</p>
              </section>
            )}
    </>
  );
}
