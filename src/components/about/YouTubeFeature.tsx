import { YouTubeIcon } from '../ChannelIcons';

export default function YouTubeFeature() {
  return (
    <section className="luxury-card mb-12 rounded-2xl border border-cyan-400/12 bg-gradient-to-br from-[#08131d] to-transparent p-8">
      <div className="flex flex-col items-center gap-8 md:flex-row">
        <div className="flex-shrink-0">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-600 shadow-[0_0_28px_rgba(239,68,68,0.25)]">
            <YouTubeIcon className="h-10 w-10 text-white" />
          </div>
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="mb-2 font-serif text-2xl font-bold text-white">Смотрите нас на YouTube</h3>
          <p className="mb-4 text-luxury-gray-light">
            Видео о поэтах, их жизни, тревогах, трагических и лирических историях. Глубокие разборы стихов и судеб.
          </p>
          <a
            href="https://youtube.com/@TheLegendaryPoet"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700"
          >
            <YouTubeIcon className="h-[18px] w-[18px]" /> Перейти на канал
          </a>
        </div>
      </div>
    </section>
  );
}