import type { EssayBlock } from '../../types/essay';

interface CitationRule {
  blockId: string;
  sourceIds: string[];
}

export function attachEssayCitations(
  blocks: EssayBlock[],
  rules: CitationRule[],
): EssayBlock[] {
  const blockIds = new Set(blocks.flatMap((block) => (block.id ? [block.id] : [])));
  for (const rule of rules) {
    if (!blockIds.has(rule.blockId)) {
      throw new Error(`Citation rule points to missing essay block: ${rule.blockId}`);
    }
  }

  return blocks.map((block) => {
    if (block.type !== 'paragraph' && block.type !== 'lead' && block.type !== 'note') return block;
    const rule = rules.find(({ blockId }) => block.id === blockId);
    return rule ? { ...block, sourceIds: rule.sourceIds } : block;
  });
}

export const mayakovskyPartOneCitationRules: CitationRule[] = [
  { blockId: 'early-birth', sourceIds: ['self-autobiography', 'family-1905'] },
  { blockId: 'early-underground', sourceIds: ['self-autobiography', 'reg-card-1908'] },
  { blockId: 'early-burlyuk', sourceIds: ['self-autobiography', 'student-1910', 'early-chronicle-1912'] },
  { blockId: 'early-futurists', sourceIds: ['early-chronicle-1912', 'futurists-1912', 'early-latest-russian-poetry'] },
  { blockId: 'early-stage', sourceIds: ['early-chronicle-1913', 'nate'] },
  { blockId: 'early-listen', sourceIds: ['listen'] },
  { blockId: 'early-cloud', sourceIds: ['cloud', 'cloud-preface'] },
  { blockId: 'early-briks', sourceIds: ['self-autobiography', 'mayakovsky-lilya-1915', 'early-chronicle-1915'] },
  { blockId: 'early-lilichka', sourceIds: ['lilichka'] },
  { blockId: 'early-cinema', sourceIds: ['lady-hooligan', 'mystery-bouffe-first'] },
];

export const mayakovskyPartTwoCitationRules: CitationRule[] = [
  { blockId: 'late-lead', sourceIds: ['self-late', 'full-voice'] },
  { blockId: 'late-rosta', sourceIds: ['articles-1918-1930', 'how-to-make-poems'] },
  { blockId: 'late-lef', sourceIds: ['lef-ref', 'circle-1924', 'circle-1925'] },
  { blockId: 'late-america', sourceIds: ['mexico-1925', 'jangfeldt-biography'] },
  { blockId: 'late-relationships', sourceIds: ['yakovleva-letter', 'kostrov-letter', 'crimea-1926'] },
  { blockId: 'late-exhibition', sourceIds: ['opening-exhibition', 'museum-invited-list'] },
  { blockId: 'late-october', sourceIds: ['self-late', 'mystery-bouffe-libretto', 'lenin-poem'] },
  { blockId: 'late-crises', sourceIds: ['bathhouse', 'letter-lilya-march-1930', 'opening-exhibition', 'red-presnya-speech'] },
  { blockId: 'late-death', sourceIds: ['letter-everyone', 'chronicle-1930'] },
  { blockId: 'late-funeral', sourceIds: ['chronicle-1930', 'kle-mayakovsky'] },
];

export const brikCitationRules: CitationRule[] = [
  { blockId: 'brik-lead', sourceIds: ['brik-self', 'brik-photo-mayakovsky-lilya-1915', 'brik-correspondence'] },
  { blockId: 'brik-apartment', sourceIds: ['brik-self', 'brik-photo-circle-1924', 'brik-photo-circle-1925'] },
  { blockId: 'brik-cloud-context', sourceIds: ['brik-self', 'brik-variants'] },
  { blockId: 'brik-union', sourceIds: ['brik-correspondence', 'rgali-lilya-katanyan', 'rgali-osip'] },
  { blockId: 'brik-dependence', sourceIds: ['brik-correspondence', 'puppy-note'] },
  { blockId: 'brik-ring', sourceIds: ['ring-lyub', 'brik-love'] },
  { blockId: 'brik-separation', sourceIds: ['brik-letter-dec-1922', 'brik-letter-jan-1923', 'brik-pro-eto'] },
  { blockId: 'brik-imprisonment', sourceIds: ['brik-correspondence', 'paperny-pro-eto'] },
  { blockId: 'brik-diary', sourceIds: ['parnis-diary', 'rgali-lilya-katanyan'] },
];
