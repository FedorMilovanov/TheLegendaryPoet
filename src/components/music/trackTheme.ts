import type { CSSProperties } from 'react';
import type { MusicTrack } from '../../types/poet';

const fallbackTheme = {
  accent: '#d4af37',
  secondary: '#2ed8ff',
  surface: '#071018',
  heroPosition: '50% center',
};

export type TrackThemeStyle = CSSProperties & {
  '--track-accent': string;
  '--track-secondary': string;
  '--track-surface': string;
};

export function getTrackTheme(track: MusicTrack) {
  return { ...fallbackTheme, ...track.theme };
}

export function getTrackThemeStyle(track: MusicTrack): TrackThemeStyle {
  const theme = getTrackTheme(track);
  return {
    '--track-accent': theme.accent,
    '--track-secondary': theme.secondary,
    '--track-surface': theme.surface,
  };
}
