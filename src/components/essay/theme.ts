import type { EssayBlock } from '../../types/essay';

/**
 * Essay engine — design tokens.
 *
 * The single place the essay engine's visual language is defined. Block
 * components, the hero and the listing card all read from here, so a new
 * article is pure DATA and the look stays consistent everywhere. Change a
 * value here → every essay updates.
 */

/** Default hero / accent gold when an essay doesn't specify its own `accent`. */
export const DEFAULT_ACCENT = '#d4af37';

/**
 * Cover-artwork fallback: a soft radial wash of the essay's accent over a deep
 * blue-black. Shared by the hero and the listing card so a missing cover image
 * still looks intentional. `focusY` shifts the radial highlight vertically.
 */
export function coverBackground(accent: string, focusY = '20%'): string {
  return `radial-gradient(circle at 50% ${focusY}, ${accent}22, transparent 60%), linear-gradient(160deg, #07131c 0%, #0a0a0a 72%)`;
}

type VoiceKind = NonNullable<Extract<EssayBlock, { type: 'voice' }>['kind']>;

/**
 * Per-voice styling and label, so a sourced quote reads by *who* is speaking —
 * the poet himself, his circle, a fellow poet, or a literary historian.
 * Labels are deliberately generic (no poet baked in) so the engine is reusable.
 */
export const voiceConfig: Record<VoiceKind, { border: string; label: string; dot: string }> = {
  self:      { border: 'border-luxury-gold/30',  label: 'Слова поэта',        dot: 'bg-luxury-gold' },
  friend:    { border: 'border-cyan-400/25',     label: 'Из круга поэта',     dot: 'bg-cyan-400' },
  poet:      { border: 'border-purple-400/25',   label: 'Другой поэт',        dot: 'bg-purple-400' },
  historian: { border: 'border-cyan-300/20',     label: 'Историк литературы', dot: 'bg-cyan-300' },
};

export const DEFAULT_VOICE_KIND: VoiceKind = 'friend';

/**
 * Poem palettes. `default` is the illuminated-gold manuscript look; `blood` is
 * the red-tinted variant reserved for a poem literally written in blood
 * (Yesenin's last note), so it must never be used decoratively.
 */
export const poemVariant = {
  default: {
    frame: 'border-luxury-gold/10 bg-[#050505]',
    rule: 'bg-gradient-to-b from-luxury-gold/60 to-luxury-gold/5',
    title: 'text-luxury-gold-light',
    body: 'text-white/90',
    noteRule: 'border-luxury-gold/10 text-luxury-gray-light/70',
  },
  blood: {
    frame: 'border-red-500/20 bg-[#0a0505]',
    rule: 'bg-gradient-to-b from-red-500/60 to-red-900/10',
    title: 'text-red-200',
    body: 'text-red-50/90',
    noteRule: 'border-red-500/15 text-red-100/60',
  },
} as const;
