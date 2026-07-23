import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { MusicTrack } from '../../types/poet';
import { asset } from '../../utils/asset';

export type AudioStatus = 'idle' | 'loading' | 'ready' | 'buffering' | 'error';

interface LoadTrackOptions {
  startAt?: number;
  autoplay?: boolean;
}

interface AudioPlayerContextValue {
  currentTrack: MusicTrack | null;
  playing: boolean;
  ended: boolean;
  status: AudioStatus;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  resumeAt: number | null;
  immersiveOpen: boolean;
  completedTrackIds: ReadonlySet<string>;
  loadTrack: (track: MusicTrack, options?: LoadTrackOptions) => void;
  playTrack: (track: MusicTrack, options?: Omit<LoadTrackOptions, 'autoplay'>) => Promise<void>;
  toggleTrack: (track: MusicTrack) => Promise<void>;
  pause: () => void;
  seekTo: (seconds: number) => void;
  seekBy: (seconds: number) => void;
  restart: () => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  closePlayer: () => void;
  openImmersive: (track?: MusicTrack) => void;
  closeImmersive: () => void;
  getSavedPosition: (trackId: string) => number;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);

const LAST_TRACK_KEY = 'tlp-audio-last-track';
const VOLUME_KEY = 'tlp-audio-volume';
const COMPLETED_KEY = 'tlp-audio-completed';
const positionKey = (trackId: string) => `tlp-audio-position:${trackId}`;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function readStoredNumber(key: string, fallback = 0) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function readCompletedTracks() {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(COMPLETED_KEY) ?? '[]');
    return new Set<string>(Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : []);
  } catch {
    return new Set<string>();
  }
}

export function AudioPlayerProvider({ tracks, children }: { tracks: readonly MusicTrack[]; children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrackRef = useRef<MusicTrack | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const pendingAutoplayRef = useRef(false);
  const lastSavedRef = useRef(0);
  const adjacentPlaybackRef = useRef<(direction: -1 | 1) => Promise<void>>(async () => undefined);
  const completedRef = useRef<Set<string>>(readCompletedTracks());

  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(() => clamp(readStoredNumber(VOLUME_KEY, 0.9), 0, 1));
  const [muted, setMuted] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const [completedTrackIds, setCompletedTrackIds] = useState<ReadonlySet<string>>(() => new Set(completedRef.current));

  const getSavedPosition = useCallback((trackId: string) => Math.max(0, readStoredNumber(positionKey(trackId), 0)), []);

  const persistCompleted = useCallback((trackId: string) => {
    if (completedRef.current.has(trackId)) return;
    completedRef.current = new Set(completedRef.current).add(trackId);
    setCompletedTrackIds(new Set(completedRef.current));
    try { window.localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completedRef.current])); } catch { /* storage unavailable */ }
  }, []);

  const applyPendingSeek = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    const requested = pendingSeekRef.current;
    pendingSeekRef.current = null;
    if (requested === null) return;
    const safe = clamp(requested, 0, Math.max(0, audio.duration - 0.1));
    audio.currentTime = safe;
    setCurrentTime(safe);
    setResumeAt(safe >= 8 ? safe : null);
    lastSavedRef.current = safe;
  }, []);

  const setTrackSource = useCallback((track: MusicTrack, startAt?: number) => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) return false;

    currentTrackRef.current = track;
    setCurrentTrack(track);
    setPlaying(false);
    setEnded(false);
    setStatus('loading');
    setCurrentTime(0);
    setDuration(track.durationSeconds ?? 0);
    setBuffered(0);
    setResumeAt(null);
    lastSavedRef.current = 0;

    const savedPosition = startAt ?? getSavedPosition(track.id);
    pendingSeekRef.current = savedPosition > 0 ? savedPosition : null;
    audio.src = asset(track.audioUrl);
    audio.load();
    try { window.localStorage.setItem(LAST_TRACK_KEY, track.id); } catch { /* storage unavailable */ }
    return true;
  }, [getSavedPosition]);

  const loadTrack = useCallback((track: MusicTrack, options: LoadTrackOptions = {}) => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) return;

    const isSameTrack = currentTrackRef.current?.id === track.id;
    if (!isSameTrack) {
      pendingAutoplayRef.current = options.autoplay ?? false;
      setTrackSource(track, options.startAt);
      if (options.autoplay) {
        void audio.play().catch(() => {
          /* loadedmetadata retries while preserving the original user action */
        });
      }
      return;
    }

    if (options.startAt !== undefined) {
      const limit = Number.isFinite(audio.duration) && audio.duration > 0
        ? audio.duration
        : track.durationSeconds ?? options.startAt;
      const safe = clamp(options.startAt, 0, Math.max(0, limit - 0.1));
      audio.currentTime = safe;
      setCurrentTime(safe);
      setResumeAt(null);
    }

    if (options.autoplay) {
      setEnded(false);
      setStatus('loading');
      void audio.play().catch(() => {
        setStatus('error');
        setPlaying(false);
      });
    }
  }, [setTrackSource]);

  const playTrack = useCallback(async (track: MusicTrack, options: Omit<LoadTrackOptions, 'autoplay'> = {}) => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) return;
    loadTrack(track, { ...options, autoplay: true });
  }, [loadTrack]);

  const toggleTrack = useCallback(async (track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) return;
    if (currentTrackRef.current?.id === track.id && !audio.paused) {
      audio.pause();
      return;
    }
    await playTrack(track);
  }, [playTrack]);

  const pause = useCallback(() => audioRef.current?.pause(), []);

  const seekTo = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || currentTrackRef.current === null) return;
    const limit = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : currentTrackRef.current.durationSeconds ?? seconds;
    const safe = clamp(seconds, 0, Math.max(0, limit - 0.1));
    audio.currentTime = safe;
    setCurrentTime(safe);
    setResumeAt(null);
    setEnded(false);
  }, []);

  const seekBy = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime + seconds);
  }, [seekTo]);

  const restart = useCallback(() => {
    const track = currentTrackRef.current;
    if (!track) return;
    seekTo(0);
    try { window.localStorage.removeItem(positionKey(track.id)); } catch { /* storage unavailable */ }
  }, [seekTo]);

  const setVolume = useCallback((value: number) => {
    const next = clamp(value, 0, 1);
    setVolumeState(next);
    setMuted(next === 0);
    try { window.localStorage.setItem(VOLUME_KEY, String(next)); } catch { /* storage unavailable */ }
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((value) => {
      if (value) return false;
      if (volume === 0) setVolume(0.75);
      return true;
    });
  }, [setVolume, volume]);

  const playAdjacent = useCallback(async (direction: -1 | 1) => {
    const track = currentTrackRef.current;
    if (!track || tracks.length < 2) return;
    const currentIndex = tracks.findIndex((item) => item.id === track.id);
    if (currentIndex < 0) return;
    const nextIndex = (currentIndex + direction + tracks.length) % tracks.length;
    const nextTrack = tracks[nextIndex];
    if (nextTrack) await playTrack(nextTrack, { startAt: 0 });
  }, [playTrack, tracks]);

  adjacentPlaybackRef.current = playAdjacent;

  const playNext = useCallback(() => playAdjacent(1), [playAdjacent]);
  const playPrevious = useCallback(() => playAdjacent(-1), [playAdjacent]);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
    }
    currentTrackRef.current = null;
    pendingSeekRef.current = null;
    pendingAutoplayRef.current = false;
    setCurrentTrack(null);
    setPlaying(false);
    setEnded(false);
    setStatus('idle');
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setResumeAt(null);
    setImmersiveOpen(false);
    try { window.localStorage.removeItem(LAST_TRACK_KEY); } catch { /* storage unavailable */ }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = 'none';
    }
  }, []);

  const openImmersive = useCallback((track?: MusicTrack) => {
    if (track && currentTrackRef.current?.id !== track.id) loadTrack(track);
    if (track || currentTrackRef.current) setImmersiveOpen(true);
  }, [loadTrack]);
  const closeImmersive = useCallback(() => setImmersiveOpen(false), []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [muted, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateBuffered = () => {
      if (!audio.buffered.length) {
        setBuffered(0);
        return;
      }
      setBuffered(audio.buffered.end(audio.buffered.length - 1));
    };

    const configureMediaSession = () => {
      const track = currentTrackRef.current;
      if (!track || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;

      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: `${track.poet} · The Legendary Poet`,
        album: 'Музыкальные интерпретации русской поэзии',
        artwork: track.coverUrl
          ? [{ src: asset(track.coverUrl), sizes: '1400x1400', type: 'image/webp' }]
          : undefined,
      });

      const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
        try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
      };
      setHandler('play', () => { void audio.play(); });
      setHandler('pause', () => audio.pause());
      setHandler('stop', closePlayer);
      setHandler('seekbackward', (details) => seekBy(-(details.seekOffset ?? 10)));
      setHandler('seekforward', (details) => seekBy(details.seekOffset ?? 10));
      setHandler('seekto', (details) => {
        if (details.seekTime === undefined) return;
        if (details.fastSeek && typeof audio.fastSeek === 'function') audio.fastSeek(details.seekTime);
        else seekTo(details.seekTime);
      });
      setHandler('nexttrack', () => { void adjacentPlaybackRef.current(1); });
      setHandler('previoustrack', () => { void adjacentPlaybackRef.current(-1); });
    };

    const updatePositionState = () => {
      if (!('mediaSession' in navigator) || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: clamp(audio.currentTime, 0, audio.duration),
        });
      } catch { /* transient browser state */ }
    };

    const syncTime = () => {
      const track = currentTrackRef.current;
      setCurrentTime(audio.currentTime);
      updatePositionState();
      if (!track || audio.ended) return;

      if (audio.currentTime > 4 && Math.abs(audio.currentTime - lastSavedRef.current) >= 3) {
        lastSavedRef.current = audio.currentTime;
        try { window.localStorage.setItem(positionKey(track.id), String(audio.currentTime)); } catch { /* storage unavailable */ }
      }

      if (audio.duration > 30 && audio.currentTime / audio.duration >= 0.9) persistCompleted(track.id);
    };

    const syncDuration = () => {
      const track = currentTrackRef.current;
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : track?.durationSeconds ?? 0;
      setDuration(nextDuration);
      updateBuffered();
      applyPendingSeek();
      if (pendingAutoplayRef.current) {
        void audio.play().catch(() => {
          setStatus('error');
          setPlaying(false);
        });
      }
    };

    const onLoadStart = () => setStatus('loading');
    const onCanPlay = () => setStatus((value) => value === 'error' ? value : 'ready');
    const onWaiting = () => { if (!audio.paused) setStatus('buffering'); };
    const onError = () => {
      pendingAutoplayRef.current = false;
      setStatus('error');
      setPlaying(false);
    };
    const onPlay = () => {
      pendingAutoplayRef.current = false;
      setPlaying(true);
      setEnded(false);
      setStatus('ready');
      configureMediaSession();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    };
    const onPause = () => {
      setPlaying(false);
      setStatus((value) => value === 'error' ? value : 'ready');
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    };
    const onEnd = () => {
      const track = currentTrackRef.current;
      setPlaying(false);
      setEnded(true);
      setCurrentTime(audio.duration || 0);
      setResumeAt(null);
      if (track) {
        persistCompleted(track.id);
        try { window.localStorage.removeItem(positionKey(track.id)); } catch { /* storage unavailable */ }
      }
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'none';
    };

    audio.addEventListener('timeupdate', syncTime);
    audio.addEventListener('loadedmetadata', syncDuration);
    audio.addEventListener('durationchange', syncDuration);
    audio.addEventListener('progress', updateBuffered);
    audio.addEventListener('loadstart', onLoadStart);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('playing', onCanPlay);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onWaiting);
    audio.addEventListener('error', onError);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnd);

    const savedTrackId = (() => {
      try { return window.localStorage.getItem(LAST_TRACK_KEY); } catch { return null; }
    })();
    const savedTrack = tracks.find((track) => track.id === savedTrackId);
    if (savedTrack?.audioUrl) setTrackSource(savedTrack);

    return () => {
      audio.removeEventListener('timeupdate', syncTime);
      audio.removeEventListener('loadedmetadata', syncDuration);
      audio.removeEventListener('durationchange', syncDuration);
      audio.removeEventListener('progress', updateBuffered);
      audio.removeEventListener('loadstart', onLoadStart);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('playing', onCanPlay);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onWaiting);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnd);
    };
  }, [applyPendingSeek, closePlayer, persistCompleted, seekBy, seekTo, setTrackSource, tracks]);

  const value = useMemo<AudioPlayerContextValue>(() => ({
    currentTrack,
    playing,
    ended,
    status,
    currentTime,
    duration,
    buffered,
    volume,
    muted,
    resumeAt,
    immersiveOpen,
    completedTrackIds,
    loadTrack,
    playTrack,
    toggleTrack,
    pause,
    seekTo,
    seekBy,
    restart,
    setVolume,
    toggleMute,
    playNext,
    playPrevious,
    closePlayer,
    openImmersive,
    closeImmersive,
    getSavedPosition,
  }), [
    buffered,
    closeImmersive,
    closePlayer,
    completedTrackIds,
    currentTime,
    currentTrack,
    duration,
    ended,
    getSavedPosition,
    immersiveOpen,
    loadTrack,
    muted,
    openImmersive,
    pause,
    playNext,
    playPrevious,
    playTrack,
    playing,
    restart,
    resumeAt,
    seekBy,
    seekTo,
    setVolume,
    status,
    toggleMute,
    toggleTrack,
    volume,
  ]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" controlsList="nodownload noplaybackrate" onContextMenu={(event) => event.preventDefault()} />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error('useAudioPlayer must be used inside AudioPlayerProvider');
  return context;
}
