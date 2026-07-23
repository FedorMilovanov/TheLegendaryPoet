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
import {
  AUDIO_COORDINATION_CHANNEL,
  AUDIO_COORDINATION_STORAGE_KEY,
  getStoredTrackPosition,
  readAudioSession,
  setStoredCompletedTracks,
  setStoredLastTrack,
  setStoredTrackPosition,
  setStoredVolume,
} from './audioSessionStore';

export type AudioStatus = 'idle' | 'loading' | 'ready' | 'buffering' | 'error';
export type AudioFailureReason = 'network' | 'decode' | 'source' | 'blocked' | 'aborted' | 'unknown';

export interface AudioFailure {
  reason: AudioFailureReason;
  message: string;
}

interface LoadTrackOptions {
  startAt?: number;
  autoplay?: boolean;
}

interface AudioPlayerContextValue {
  currentTrack: MusicTrack | null;
  playing: boolean;
  ended: boolean;
  status: AudioStatus;
  failure: AudioFailure | null;
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
  retry: () => void;
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

interface CoordinationMessage {
  type: 'playing';
  instanceId: string;
  trackId: string;
  timestamp: number;
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | null>(null);
const mediaActions: MediaSessionAction[] = ['play', 'pause', 'stop', 'seekbackward', 'seekforward', 'seekto', 'nexttrack', 'previoustrack'];
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function createInstanceId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `audio-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function setMediaPlaybackState(state: MediaSessionPlaybackState) {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  try { navigator.mediaSession.playbackState = state; } catch { /* incomplete browser implementation */ }
}

function clearMediaSession() {
  if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
  for (const action of mediaActions) {
    try { navigator.mediaSession.setActionHandler(action, null); } catch { /* unsupported action */ }
  }
  try {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = 'none';
  } catch {
    // Some embedded browsers expose an incomplete Media Session implementation.
  }
}

function failureFromMediaError(error: MediaError | null): AudioFailure {
  switch (error?.code) {
    case MediaError.MEDIA_ERR_ABORTED:
      return { reason: 'aborted', message: 'Загрузка аудио была прервана.' };
    case MediaError.MEDIA_ERR_NETWORK:
      return { reason: 'network', message: 'Соединение прервалось во время загрузки аудио.' };
    case MediaError.MEDIA_ERR_DECODE:
      return { reason: 'decode', message: 'Браузер не смог декодировать аудиофайл.' };
    case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
      return { reason: 'source', message: 'Аудиофайл недоступен или не поддерживается браузером.' };
    default:
      return { reason: 'unknown', message: 'Не удалось подготовить аудио к воспроизведению.' };
  }
}

function failureFromPlayError(error: unknown): AudioFailure | null {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    if (error.name === 'AbortError') return null;
    if (error.name === 'NotAllowedError') {
      return { reason: 'blocked', message: 'Браузер заблокировал запуск. Нажмите кнопку воспроизведения ещё раз.' };
    }
    if (error.name === 'NotSupportedError') {
      return { reason: 'source', message: 'Формат или источник аудио не поддерживается браузером.' };
    }
  }
  return { reason: 'unknown', message: 'Воспроизведение не запустилось. Попробуйте ещё раз.' };
}

function isCoordinationMessage(value: unknown): value is CoordinationMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<CoordinationMessage>;
  return message.type === 'playing'
    && typeof message.instanceId === 'string'
    && typeof message.trackId === 'string'
    && Number.isFinite(message.timestamp);
}

export function AudioPlayerProvider({ tracks, children }: { tracks: readonly MusicTrack[]; children: ReactNode }) {
  const initialSessionRef = useRef(readAudioSession());
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentTrackRef = useRef<MusicTrack | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const pendingAutoplayRef = useRef(false);
  const sourceVersionRef = useRef(0);
  const playAttemptVersionRef = useRef<number | null>(null);
  const suppressPausePersistenceRef = useRef(false);
  const sourceTransitionRef = useRef(false);
  const lastSavedRef = useRef(0);
  const restoredRef = useRef(false);
  const instanceIdRef = useRef(createInstanceId());
  const coordinationChannelRef = useRef<BroadcastChannel | null>(null);
  const adjacentPlaybackRef = useRef<(direction: -1 | 1) => Promise<void>>(async () => undefined);
  const completedRef = useRef<Set<string>>(new Set(initialSessionRef.current.completedTrackIds));

  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [status, setStatus] = useState<AudioStatus>('idle');
  const [failure, setFailure] = useState<AudioFailure | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(clamp(initialSessionRef.current.volume, 0, 1));
  const [muted, setMuted] = useState(initialSessionRef.current.muted);
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const [completedTrackIds, setCompletedTrackIds] = useState<ReadonlySet<string>>(() => new Set(completedRef.current));

  const getSavedPosition = useCallback((trackId: string) => getStoredTrackPosition(trackId), []);

  const persistCompleted = useCallback((trackId: string) => {
    if (completedRef.current.has(trackId)) return;
    completedRef.current = new Set(completedRef.current).add(trackId);
    setCompletedTrackIds(new Set(completedRef.current));
    setStoredCompletedTracks(completedRef.current);
  }, []);

  const persistCurrentPosition = useCallback((force = false) => {
    const audio = audioRef.current;
    const track = currentTrackRef.current;
    if (!audio || !track) return;

    const position = pendingSeekRef.current ?? audio.currentTime;
    const total = Number.isFinite(audio.duration) && audio.duration > 0
      ? audio.duration
      : track.durationSeconds ?? 0;

    if (audio.ended || (total > 0 && position >= total - 2)) {
      setStoredTrackPosition(track.id, null);
      lastSavedRef.current = 0;
      return;
    }

    if (position < 4) {
      if (force) setStoredTrackPosition(track.id, null);
      lastSavedRef.current = 0;
      return;
    }

    if (force || Math.abs(position - lastSavedRef.current) >= 3) {
      setStoredTrackPosition(track.id, position);
      lastSavedRef.current = position;
    }
  }, []);

  const applyPendingSeek = useCallback(() => {
    const audio = audioRef.current;
    const requested = pendingSeekRef.current;
    if (!audio || requested === null || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    pendingSeekRef.current = null;
    const safe = clamp(requested, 0, Math.max(0, audio.duration - 0.1));
    audio.currentTime = safe;
    setCurrentTime(safe);
    setResumeAt(safe >= 8 ? safe : null);
    lastSavedRef.current = safe;
  }, []);

  const requestPosition = useCallback((seconds: number, showResume = false) => {
    const audio = audioRef.current;
    const track = currentTrackRef.current;
    if (!audio || !track || !Number.isFinite(seconds)) return 0;

    const metadataReady = audio.readyState > 0 && Number.isFinite(audio.duration) && audio.duration > 0;
    const provisionalLimit = metadataReady ? audio.duration : track.durationSeconds ?? Math.max(0, seconds);
    const safe = clamp(seconds, 0, Math.max(0, provisionalLimit - 0.1));

    if (metadataReady) {
      audio.currentTime = safe;
      pendingSeekRef.current = null;
    } else {
      pendingSeekRef.current = safe;
    }

    setCurrentTime(safe);
    setResumeAt(showResume && safe >= 8 ? safe : null);
    setEnded(false);

    if (safe >= 4) {
      setStoredTrackPosition(track.id, safe);
      lastSavedRef.current = safe;
    } else {
      setStoredTrackPosition(track.id, null);
      lastSavedRef.current = 0;
    }

    return safe;
  }, []);

  const requestPlayback = useCallback((audio: HTMLAudioElement) => {
    const sourceVersion = sourceVersionRef.current;
    pendingAutoplayRef.current = true;
    setFailure(null);
    setStatus('loading');
    if (playAttemptVersionRef.current === sourceVersion) return;

    playAttemptVersionRef.current = sourceVersion;
    void audio.play().catch((error: unknown) => {
      if (sourceVersion !== sourceVersionRef.current) return;
      playAttemptVersionRef.current = null;
      const nextFailure = failureFromPlayError(error);
      if (!nextFailure) return;
      pendingAutoplayRef.current = false;
      setFailure(nextFailure);
      setStatus('error');
      setPlaying(false);
    });
  }, []);

  const setTrackSource = useCallback((track: MusicTrack, startAt?: number) => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) return false;

    persistCurrentPosition(true);
    sourceVersionRef.current += 1;
    sourceTransitionRef.current = true;
    suppressPausePersistenceRef.current = !audio.paused || playAttemptVersionRef.current !== null;
    playAttemptVersionRef.current = null;
    audio.pause();

    currentTrackRef.current = track;
    setCurrentTrack(track);
    setPlaying(false);
    setEnded(false);
    setFailure(null);
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
    setStoredLastTrack(track.id);
    return true;
  }, [getSavedPosition, persistCurrentPosition]);

  const loadTrack = useCallback((track: MusicTrack, options: LoadTrackOptions = {}) => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) return;

    if (currentTrackRef.current?.id !== track.id) {
      pendingAutoplayRef.current = options.autoplay ?? false;
      if (!setTrackSource(track, options.startAt)) return;
      if (options.autoplay) requestPlayback(audio);
      return;
    }

    if (options.startAt !== undefined) requestPosition(options.startAt);
    if (options.autoplay) requestPlayback(audio);
  }, [requestPlayback, requestPosition, setTrackSource]);

  const playTrack = useCallback(async (track: MusicTrack, options: Omit<LoadTrackOptions, 'autoplay'> = {}) => {
    if (!track.audioUrl || !audioRef.current) return;
    loadTrack(track, { ...options, autoplay: true });
  }, [loadTrack]);

  const retry = useCallback(() => {
    const audio = audioRef.current;
    const track = currentTrackRef.current;
    if (!audio || !track?.audioUrl) return;
    const retryAt = pendingSeekRef.current ?? (Number.isFinite(audio.currentTime) && audio.currentTime > 0
      ? audio.currentTime
      : getSavedPosition(track.id));
    pendingAutoplayRef.current = true;
    if (setTrackSource(track, retryAt)) requestPlayback(audio);
  }, [getSavedPosition, requestPlayback, setTrackSource]);

  const toggleTrack = useCallback(async (track: MusicTrack) => {
    const audio = audioRef.current;
    if (!audio || !track.audioUrl) return;
    if (currentTrackRef.current?.id === track.id && status === 'error') {
      retry();
      return;
    }
    if (currentTrackRef.current?.id === track.id && !audio.paused) {
      audio.pause();
      return;
    }
    await playTrack(track);
  }, [playTrack, retry, status]);

  const pause = useCallback(() => audioRef.current?.pause(), []);
  const seekTo = useCallback((seconds: number) => { requestPosition(seconds); }, [requestPosition]);

  const seekBy = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const base = pendingSeekRef.current ?? audio.currentTime;
    requestPosition(base + seconds);
  }, [requestPosition]);

  const restart = useCallback(() => {
    const track = currentTrackRef.current;
    if (!track) return;
    requestPosition(0);
    setStoredTrackPosition(track.id, null);
    lastSavedRef.current = 0;
  }, [requestPosition]);

  const setVolume = useCallback((value: number) => {
    const next = clamp(value, 0, 1);
    const nextMuted = next === 0;
    setVolumeState(next);
    setMuted(nextMuted);
    setStoredVolume(next, nextMuted);
  }, []);

  const toggleMute = useCallback(() => {
    if (muted) {
      if (volume === 0) {
        setVolumeState(0.75);
        setMuted(false);
        setStoredVolume(0.75, false);
      } else {
        setMuted(false);
        setStoredVolume(volume, false);
      }
      return;
    }
    setMuted(true);
    setStoredVolume(volume, true);
  }, [muted, volume]);

  const playAdjacent = useCallback(async (direction: -1 | 1) => {
    const track = currentTrackRef.current;
    if (!track || tracks.length < 2) return;
    const currentIndex = tracks.findIndex((item) => item.id === track.id);
    if (currentIndex < 0) return;
    const nextTrack = tracks[(currentIndex + direction + tracks.length) % tracks.length];
    if (nextTrack) await playTrack(nextTrack, { startAt: 0 });
  }, [playTrack, tracks]);

  adjacentPlaybackRef.current = playAdjacent;
  const playNext = useCallback(() => playAdjacent(1), [playAdjacent]);
  const playPrevious = useCallback(() => playAdjacent(-1), [playAdjacent]);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;
    persistCurrentPosition(true);
    sourceVersionRef.current += 1;
    sourceTransitionRef.current = true;
    suppressPausePersistenceRef.current = Boolean(audio && (!audio.paused || playAttemptVersionRef.current !== null));
    playAttemptVersionRef.current = null;
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
    setFailure(null);
    setStatus('idle');
    setCurrentTime(0);
    setDuration(0);
    setBuffered(0);
    setResumeAt(null);
    setImmersiveOpen(false);
    setStoredLastTrack(null);
    clearMediaSession();
    window.setTimeout(() => {
      sourceTransitionRef.current = false;
      suppressPausePersistenceRef.current = false;
    }, 0);
  }, [persistCurrentPosition]);

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

    const handleRemotePlayback = (message: CoordinationMessage) => {
      if (message.instanceId === instanceIdRef.current || audio.paused) return;
      audio.pause();
    };

    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(AUDIO_COORDINATION_CHANNEL);
      coordinationChannelRef.current = channel;
      channel.addEventListener('message', (event: MessageEvent<unknown>) => {
        if (isCoordinationMessage(event.data)) handleRemotePlayback(event.data);
      });
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== AUDIO_COORDINATION_STORAGE_KEY || !event.newValue) return;
      try {
        const message: unknown = JSON.parse(event.newValue);
        if (isCoordinationMessage(message)) handleRemotePlayback(message);
      } catch {
        // Ignore malformed cross-tab messages.
      }
    };

    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      coordinationChannelRef.current?.close();
      coordinationChannelRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const announcePlayback = (trackId: string) => {
      const message: CoordinationMessage = {
        type: 'playing',
        instanceId: instanceIdRef.current,
        trackId,
        timestamp: Date.now(),
      };
      coordinationChannelRef.current?.postMessage(message);
      try { window.localStorage.setItem(AUDIO_COORDINATION_STORAGE_KEY, JSON.stringify(message)); } catch { /* storage unavailable */ }
    };

    const updateBuffered = () => {
      if (!audio.buffered.length) {
        setBuffered(0);
        return;
      }
      try {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      } catch {
        setBuffered(0);
      }
    };

    const configureMediaSession = () => {
      const track = currentTrackRef.current;
      if (!track || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return;

      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: track.title,
          artist: `${track.poet} · The Legendary Poet`,
          album: 'Музыкальные интерпретации русской поэзии',
          artwork: track.coverUrl
            ? [{ src: asset(track.coverUrl), sizes: '1400x1400', type: 'image/webp' }]
            : undefined,
        });
      } catch {
        // Metadata is an enhancement; playback must remain available without it.
      }

      const setHandler = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
        try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported action */ }
      };
      setHandler('play', () => requestPlayback(audio));
      setHandler('pause', () => audio.pause());
      setHandler('stop', closePlayer);
      setHandler('seekbackward', (details) => seekBy(-(details.seekOffset ?? 10)));
      setHandler('seekforward', (details) => seekBy(details.seekOffset ?? 10));
      setHandler('seekto', (details) => {
        if (details.seekTime === undefined) return;
        if (details.fastSeek && typeof audio.fastSeek === 'function') audio.fastSeek(details.seekTime);
        else requestPosition(details.seekTime);
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
          position: clamp(audio.currentTime, 0, Math.max(0, audio.duration - 0.001)),
        });
      } catch {
        // Position state may reject briefly while a source is changing.
      }
    };

    const syncTime = () => {
      const track = currentTrackRef.current;
      setCurrentTime(audio.currentTime);
      updatePositionState();
      if (!track || audio.ended) return;
      persistCurrentPosition();
      if (audio.duration > 30 && audio.currentTime / audio.duration >= 0.97) persistCompleted(track.id);
    };

    const syncDuration = () => {
      const track = currentTrackRef.current;
      const nextDuration = Number.isFinite(audio.duration) ? audio.duration : track?.durationSeconds ?? 0;
      setDuration(nextDuration);
      updateBuffered();
      applyPendingSeek();
      if (pendingAutoplayRef.current && audio.paused) requestPlayback(audio);
    };

    const onLoadStart = () => {
      sourceTransitionRef.current = false;
      setFailure(null);
      setStatus('loading');
    };
    const onCanPlay = () => {
      setFailure(null);
      setStatus('ready');
      if (pendingAutoplayRef.current && audio.paused) requestPlayback(audio);
    };
    const onWaiting = () => { if (!audio.paused) setStatus('buffering'); };
    const onError = () => {
      if (sourceTransitionRef.current || !currentTrackRef.current) return;
      pendingAutoplayRef.current = false;
      playAttemptVersionRef.current = null;
      setFailure(failureFromMediaError(audio.error));
      setStatus('error');
      setPlaying(false);
    };
    const onPlay = () => {
      const track = currentTrackRef.current;
      pendingAutoplayRef.current = false;
      playAttemptVersionRef.current = null;
      suppressPausePersistenceRef.current = false;
      setPlaying(true);
      setEnded(false);
      setFailure(null);
      setStatus('ready');
      configureMediaSession();
      if (track) announcePlayback(track.id);
      setMediaPlaybackState('playing');
    };
    const onPause = () => {
      const suppressPersistence = suppressPausePersistenceRef.current;
      suppressPausePersistenceRef.current = false;
      playAttemptVersionRef.current = null;
      setPlaying(false);
      if (suppressPersistence || sourceTransitionRef.current || !currentTrackRef.current || audio.ended) return;
      persistCurrentPosition(true);
      setStatus((value) => value === 'error' ? value : 'ready');
      setMediaPlaybackState('paused');
    };
    const onEnd = () => {
      const track = currentTrackRef.current;
      playAttemptVersionRef.current = null;
      setPlaying(false);
      setEnded(true);
      setCurrentTime(audio.duration || 0);
      setResumeAt(null);
      if (track) {
        persistCompleted(track.id);
        setStoredTrackPosition(track.id, null);
      }
      setMediaPlaybackState('none');
    };
    const persistBeforeLeave = () => persistCurrentPosition(true);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') persistCurrentPosition(true);
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
    window.addEventListener('pagehide', persistBeforeLeave);
    document.addEventListener('visibilitychange', onVisibilityChange);

    if (!restoredRef.current) {
      restoredRef.current = true;
      const savedTrack = tracks.find((track) => track.id === initialSessionRef.current.lastTrackId);
      if (savedTrack?.audioUrl) setTrackSource(savedTrack, initialSessionRef.current.positions[savedTrack.id]);
    }

    return () => {
      persistCurrentPosition(true);
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
      window.removeEventListener('pagehide', persistBeforeLeave);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearMediaSession();
    };
  }, [applyPendingSeek, closePlayer, persistCompleted, persistCurrentPosition, requestPlayback, requestPosition, seekBy, setTrackSource, tracks]);

  const value = useMemo<AudioPlayerContextValue>(() => ({
    currentTrack,
    playing,
    ended,
    status,
    failure,
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
    retry,
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
    failure,
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
    retry,
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
