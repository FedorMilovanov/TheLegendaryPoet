// Palette entries are theme tokens, not literals: src/theme.css defines the
// brand neon set for the dark theme and swaps the whole palette for a deep,
// readable counterpart under `html.theme-light`. A literal hex here cannot be
// remapped, and the neons measured 1.04-1.95 painted on the cream surface.
export const EPOCH_COLORS: Record<string, string> = {
  golden: 'var(--epoch-golden)',
  philosophy: 'var(--epoch-philosophy)',
  symbolism: 'var(--epoch-symbolism)',
  acmeism: 'var(--epoch-acmeism)',
  futurism: 'var(--epoch-futurism)',
  postSymbolism: 'var(--epoch-post-symbolism)',
};

/** Translucent copy of a token colour; hex-alpha suffixes cannot follow `var()`. */
export const epochTint = (color: string, percent: number) => `color-mix(in srgb, ${color} ${percent}%, transparent)`;

export const EPOCH_LABELS: Record<string, string> = {
  golden: 'Золотой век',
  philosophy: 'Философская лирика',
  symbolism: 'Символизм',
  acmeism: 'Акмеизм',
  futurism: 'Футуризм',
  postSymbolism: 'Постсимволизм',
};
