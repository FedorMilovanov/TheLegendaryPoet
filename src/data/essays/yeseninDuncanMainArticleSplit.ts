export interface YeseninDuncanMainArticleSplitRecord {
  blockId:
    | `yesenin-p1-transition-duncan-${string}`
    | 'yesenin-p1-transition-series-boundary';
  destination: 'main-biography' | 'companion-investigation';
  reason: string;
}

/**
 * Planned reader-facing split for the twelve Duncan-specific transition blocks
 * already present in Yesenin Part I.
 *
 * This registry does not mutate the accepted 146-node topology. It freezes the
 * editorial decision before a later compaction pass: six concise bridge blocks
 * remain in the biography and six source-heavy blocks move to the companion
 * investigation. Stable IDs and internal evidence remain preserved throughout.
 */
export const yeseninDuncanMainArticleSplit = [
  {
    blockId: 'yesenin-p1-transition-duncan-independent-project',
    destination: 'main-biography',
    reason: 'Introduces Duncan as an independent artist with a Moscow project that predates Esenin.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-academic-date-hierarchy',
    destination: 'main-biography',
    reason: 'Preserves the central warning that 3 October is probable rather than synchronously documented.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-yakulov-location',
    destination: 'main-biography',
    reason: 'Retains the most stable geographic conclusion without reconstructing the whole evening.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-chronology-anchors',
    destination: 'main-biography',
    reason: 'Provides the minimum chronological bridge into the next biographical period.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-mariengof-attribution',
    destination: 'main-biography',
    reason: 'Keeps the famous scene explicitly attributed instead of silently repeating it as fact.',
  },
  {
    blockId: 'yesenin-p1-transition-series-boundary',
    destination: 'main-biography',
    reason: 'Closes Part I by opening the geography and scale of Part II.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-arrival-date-conflict',
    destination: 'companion-investigation',
    reason: 'The 23/24 July route discrepancy is useful source criticism but too granular for the biography bridge.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-competing-chronologies',
    destination: 'companion-investigation',
    reason: 'The full comparison of October and early-November memories belongs in the dedicated date analysis.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-legend-variants',
    destination: 'companion-investigation',
    reason: 'Desti, Sabaneev and Georgy Ivanov variants form a separate history of the legend.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-marriage-retrospective-boundary',
    destination: 'companion-investigation',
    reason: 'The retrospective compression of the 1921 marriage formula needs fuller documentary explanation.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-causal-boundary',
    destination: 'companion-investigation',
    reason: 'The pre-existing crisis inventory is important but interrupts the final movement of Part I.',
  },
  {
    blockId: 'yesenin-p1-transition-duncan-mutual-blame-boundary',
    destination: 'companion-investigation',
    reason: 'The mirrored blame legends require a dedicated ethical and historiographical discussion.',
  },
] as const satisfies readonly YeseninDuncanMainArticleSplitRecord[];

export const yeseninDuncanMainArticleMaximumBlocks = 6 as const;
export const yeseninDuncanCompanionTransferredBlocks = 6 as const;
export const yeseninDuncanSplitApplied = true as const;
