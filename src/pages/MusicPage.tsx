import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { musicTracks } from '../data/poets';
import TrackFeedback from '../components/community/TrackFeedback';
import { MusicTrack } from '../types/poet';
import { Clock, Download, ExternalLink, Play, Pause, AudioWaveform } from '../components/PremiumIcons';
import { asset } from '../utils/asset';
import { useSeo } from '../hooks/useSeo';

const AUDIO_EXT = /\.(mp3|ogg|wav|m4a|aac|flac)$/i;

function AudioWave({ isPlaying, color = 'text-cyan-300' }: { isPlaying: boolean; color?: string }) {
  return (
    <div className="flex h-6 w-8 items-end gap-[3px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          className={`w-[3px] rounded-full bg-current ${color}`}
          animate={
            isPlaying
              ? { height: ['4px', '16px', '6px', '20px', '4px'], opacity: [0.4, 1, 0.6, 1, 0.4] }
              : { height: '3px', opacity: 0.3 }
          }
          transition={
            isPlaying
              ? { repeat: Infinity, duration: 0.5 + i * 0.15, delay: i * 0.1, ease: 'easeInOut' }
              : { duration: 0.3 }
          }
        />
      ))}
    </div>
  );
}

function MusicHero() {
  return (
    <div className="mb-12 max-w-3xl">
      <div className="section-label mb-2">Аудиоархив</div>
      <h1 className="mb-4 font-serif text-4xl font-bold leading-tight sm:text-5xl">
        <span className="neon-blue-gradient neon-glow-text">Музыка</span> и Аудио
      </h1>
      <p className="text-base leading-relaxed text-cyan-100/55 sm:text-xl">
        Слушайте музыкальные интерпретации великих стихов. Треки доступны для прослушивания и перехода к полным публикациям.
      </p>
    </div>
  );
}

function MusicIntro() {
  return (
    <div className="luxury-card mb-12 rounded-[1.75rem] bg-[#07111a]/70 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-cyan-950/10 shadow-[0_0_24px_rgba(0,212,255,0.08)] sm:h-24 sm:w-24">
          <AudioWaveform size={42} className="text-cyan-300/55" />
        </div>
        <div className="flex-1">
          <h3 className="mb-2 font-serif text-2xl text-white">Музыкальный раздел</h3>
          <p className="mb-4 text-cyan-100/55">Слушайте опубликованные композиции и переходите к полным записям на каналах проекта.</p>
          <div className="h-1 overflow-hidden rounded-full bg-[#0c1822]"><div className="h-full w-1/3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(0,212,255,0.55)]" /></div>
        </div>
      </div>
    </div>
  );
}

function TrackRow({ track, index }: { track: MusicTrack; index: number }) {
  const hasPlayableAudio = !!track.audioUrl && AUDIO_EXT.test(track.audioUrl);
  const outboundUrl = track.externalUrl || track.videoUrl;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnd = () => setPlaying(false);
    const onPause = () => setPlaying(false);
    const onPlay = () => setPlaying(true);
    audio.addEventListener('ended', onEnd);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('play', onPlay);
    return () => {
      audio.removeEventListener('ended', onEnd);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('play', onPlay);
    };
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  return (
    <div className={`luxury-card flex flex-col gap-4 rounded-2xl bg-[#061018]/65 p-5 transition-all hover:shadow-[0_0_28px_rgba(0,212,255,0.1)] sm:flex-row sm:items-center sm:gap-6 sm:p-6 ${playing ? 'border-cyan-400/30 shadow-[0_0_20px_rgba(0,212,255,0.15)]' : ''}`}>
      <div className="flex items-center gap-4 sm:contents">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-cyan-950/20 sm:h-12 sm:w-12">
          {playing ? <AudioWave isPlaying color="text-cyan-300" /> : <span className="text-cyan-100/55">{index + 1}</span>}
        </div>

        {hasPlayableAudio ? (
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? `Пауза: ${track.title}` : `Слушать: ${track.title}`}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/10 transition-all hover:bg-cyan-400/18 hover:shadow-[0_0_18px_rgba(0,212,255,0.24)] active:scale-95"
          >
            {playing ? <Pause size={20} className="text-cyan-300" /> : <Play size={20} className="ml-0.5 text-cyan-300" />}
          </button>
        ) : outboundUrl ? (
          <a
            href={outboundUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Слушать «${track.title}» на канале`}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/10 transition-all hover:bg-cyan-400/18 hover:shadow-[0_0_18px_rgba(0,212,255,0.24)] active:scale-95"
          >
            <Play size={20} className="ml-0.5 text-cyan-300" />
          </a>
        ) : (
          <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-cyan-400/5" aria-hidden="true">
            <Play size={20} className="ml-0.5 text-cyan-100/25" />
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className={`truncate font-semibold transition-colors ${playing ? 'text-cyan-300' : 'text-white'}`}>{track.title}</h4>
        <p className="text-sm text-cyan-100/55">{track.poet}</p>
        {track.description && <p className="mt-1 text-xs text-cyan-100/35">{track.description}</p>}
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-shrink-0 sm:justify-start">
        <span className="flex items-center gap-1 text-sm text-cyan-100/40"><Clock size={14} /> {track.duration}</span>
        {hasPlayableAudio && (
          <a href={asset(track.audioUrl!)} download className="rounded-full p-2 text-cyan-100/55 transition-colors hover:bg-cyan-400/8 hover:text-cyan-300" aria-label={`Скачать «${track.title}»`}><Download size={18} /></a>
        )}
        {outboundUrl && (
          <a href={outboundUrl} target="_blank" rel="noopener noreferrer" className="rounded-full p-2 text-cyan-100/55 transition-colors hover:bg-cyan-400/8 hover:text-cyan-300" aria-label={`Открыть «${track.title}» на канале`}><ExternalLink size={18} /></a>
        )}
      </div>

      {hasPlayableAudio && <audio ref={audioRef} src={asset(track.audioUrl!)} preload="none" />}
    </div>
  );
}

function TrackList({ tracks }: { tracks: MusicTrack[] }) {
  return (
    <div className="space-y-4">
      {tracks.map((track, index) => (
        <TrackRow key={track.id} track={track} index={index} />
      ))}
    </div>
  );
}

function TrackFeedbackSection({ tracks }: { tracks: MusicTrack[] }) {
  return (
    <section className="mt-12 space-y-6">
      <h2 className="font-serif text-3xl font-bold text-white">Оценка <span className="neon-blue-gradient neon-glow-text">треков</span></h2>
      <div className="space-y-6">{tracks.map((track) => <TrackFeedback key={track.id} track={track} />)}</div>
    </section>
  );
}

function MusicFutureNote() {
  return (
    <div className="luxury-card mt-12 rounded-2xl bg-cyan-950/12 p-6">
      <div className="flex items-start gap-4">
        <AudioWaveform className="mt-1 flex-shrink-0 text-cyan-300" size={24} />
        <div>
          <h3 className="mb-2 text-lg font-semibold text-white">Раздел продолжит расти</h3>
          <p className="text-sm leading-relaxed text-cyan-100/55">Со временем здесь появятся новые записи, чтения, музыкальные интерпретации и аккуратно оформленные переходы на полные публикации проекта.</p>
        </div>
      </div>
    </div>
  );
}

export default function MusicPage() {
  useSeo({
    title: 'Музыка — THE LEGENDARY POET',
    description: 'Музыкальные интерпретации и декламации великих стихов — переходы к полным записям на каналах проекта.',
    path: '/music',
  });
  return (
    <div className="min-h-screen pb-20 pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MusicHero />
        <MusicIntro />
        <TrackList tracks={musicTracks} />
        <TrackFeedbackSection tracks={musicTracks} />
        <MusicFutureNote />
      </div>
    </div>
  );
}
