import { essays } from '../src/data/essays/index';
import type { EssayBlock, EssayMythVerdict } from '../src/types/essay';

type MythBlock = Extract<EssayBlock, { type: 'note'; variant: 'myth' }>;

type RequiredMyth = {
  claimIncludes: string;
  verdict: EssayMythVerdict;
  sourceIds: string[];
};

const requiredMyths: Record<string, RequiredMyth[]> = {
  'vykhozhu-odin-ya-na-dorogu-lermontov': [
    {
      claimIncludes: 'в ночь перед дуэлью',
      verdict: 'unproven',
      sourceIds: ['rvb-commentary', 'feb-encyclopedia'],
    },
    {
      claimIncludes: 'прямо просит смерти',
      verdict: 'false',
      sourceIds: ['rvb-text', 'feb-encyclopedia'],
    },
    {
      claimIncludes: 'полное христианское исповедание',
      verdict: 'unproven',
      sourceIds: ['rvb-text', 'feb-encyclopedia'],
    },
  ],
  'sergei-yesenin-1895-1921': [
    {
      claimIncludes: 'церковно-учительской школе',
      verdict: 'false',
      sourceIds: ['ye1-feb-chronicle-1909', 'ye1-feb-chronicle-1912'],
    },
  ],
  'yesenin-duncan-first-meeting-documents': [
    {
      claimIncludes: 'точно 3 октября 1921 года',
      verdict: 'unproven',
      sourceIds: [
        'yd1-pss-duncan-chronology',
        'yd1-mcvay-isadora-yesenin',
        'ye1-schneider-memoir-commentary',
      ],
    },
    {
      claimIncludes: 'точной стенограммой',
      verdict: 'unproven',
      sourceIds: ['ye1-mariengof-memoir', 'yd1-mcvay-isadora-yesenin'],
    },
  ],
  'mayakovsky-before-revolution': [
    {
      claimIncludes: 'написал для Лили Брик',
      verdict: 'partly-true',
      sourceIds: ['self-autobiography', 'early-chronicle-1915', 'cloud'],
    },
  ],
  'mayakovsky-gromovoy': [
    {
      claimIncludes: 'совершенно пустой зал',
      verdict: 'partly-true',
      sourceIds: ['chronicle-1930', 'red-presnya-speech', 'museum-invited-list'],
    },
    {
      claimIncludes: 'сразу после его смерти',
      verdict: 'false',
      sourceIds: ['museum-stalin-brik-1935', 'rgali-brik-stalin-letter-1935'],
    },
  ],
  'brik-case': [
    {
      claimIncludes: 'исключительно ради денег',
      verdict: 'unproven',
      sourceIds: [
        'brik-correspondence',
        'brik-letter-nov-1928',
        'rgali-lilya-katanyan',
        'rgali-osip',
      ],
    },
  ],
};

const errors: string[] = [];
const warnings: string[] = [];
const allowedVerdicts = new Set<EssayMythVerdict>([
  'false',
  'partly-true',
  'disputed',
  'unproven',
]);

function mythBlocksOf(slug: string): MythBlock[] {
  const essay = essays.find((candidate) => candidate.slug === slug);
  if (!essay) {
    errors.push(`${slug}: required myth-bearing essay is not registered`);
    return [];
  }
  return essay.blocks.filter(
    (block): block is MythBlock => block.type === 'note' && block.variant === 'myth',
  );
}

for (const essay of essays) {
  const mythBlocks = essay.blocks.filter(
    (block): block is MythBlock => block.type === 'note' && block.variant === 'myth',
  );
  if (mythBlocks.length === 0) continue;

  if (!essay.dateModified) {
    errors.push(`${essay.slug}: myth-bearing essay must record a substantive dateModified`);
  }

  const sourceIds = new Set((essay.sources ?? []).flatMap((source) => source.id ? [source.id] : []));
  const claims = new Set<string>();

  for (const [index, block] of mythBlocks.entries()) {
    const label = `${essay.slug}: myth ${index + 1}`;
    if (!allowedVerdicts.has(block.verdict)) {
      errors.push(`${label} has an unsupported verdict: ${block.verdict}`);
    }
    if (claims.has(block.claim)) errors.push(`${label} duplicates a claim in the same essay`);
    claims.add(block.claim);

    if (block.claim.length < 28) warnings.push(`${label} claim may be too compressed to identify the circulated formula`);
    if (block.text.length < 120) errors.push(`${label} documentary answer is too short for a responsible correction`);
    if (!block.origin || block.origin.length < 40) {
      errors.push(`${label} must describe where the formula circulates`);
    }
    if (!block.sourceIds?.length) {
      errors.push(`${label} has no stable source IDs`);
      continue;
    }

    for (const sourceId of block.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        errors.push(`${label} references a source absent from the essay library: ${sourceId}`);
      }
    }

    if (/https?:\/\//i.test(`${block.claim}\n${block.text}\n${block.origin ?? ''}`)) {
      errors.push(`${label} embeds a raw URL in reader copy instead of using the source library`);
    }
  }

  if (mythBlocks.length > 4) {
    warnings.push(`${essay.slug}: ${mythBlocks.length} myth cards may overwhelm the narrative`);
  }
}

for (const [slug, required] of Object.entries(requiredMyths)) {
  const blocks = mythBlocksOf(slug);
  for (const expectation of required) {
    const block = blocks.find((candidate) => candidate.claim.includes(expectation.claimIncludes));
    if (!block) {
      errors.push(`${slug}: required myth claim disappeared: ${expectation.claimIncludes}`);
      continue;
    }
    if (block.verdict !== expectation.verdict) {
      errors.push(
        `${slug}: verdict drift for “${expectation.claimIncludes}”: expected ${expectation.verdict}, found ${block.verdict}`,
      );
    }
    for (const sourceId of expectation.sourceIds) {
      if (!block.sourceIds?.includes(sourceId)) {
        errors.push(`${slug}: myth “${expectation.claimIncludes}” lost required source ${sourceId}`);
      }
    }
  }
}

const totalMyths = essays.reduce(
  (sum, essay) => sum + essay.blocks.filter(
    (block) => block.type === 'note' && block.variant === 'myth',
  ).length,
  0,
);

for (const message of warnings) console.warn(`WARN  ${message}`);
for (const message of errors) console.error(`ERROR ${message}`);
console.log(`Myth rubric validation: ${totalMyths} cards, ${errors.length} errors, ${warnings.length} warnings`);

if (errors.length > 0) process.exit(1);
