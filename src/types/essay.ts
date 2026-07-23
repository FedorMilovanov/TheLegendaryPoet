/**
 * Longform essay model — a reusable, block-based content format.
 *
 * The point of this file is that authoring a new premium article means writing
 * DATA (an array of typed blocks), never re-styling. The rendering engine
 * (components/essay/*) maps each block type to a styled component once.
 */

export type EssayImageKind = 'archive' | 'restoration' | 'reconstruction' | 'document';
export type EssayImageLayout = 'wide' | 'portrait' | 'cinematic';
export type EssayImagePlacement = 'full' | 'left' | 'right';

export interface EssayImageData {
  src: string;
  /** Key in the generated local AVIF/WebP manifest. */
  mediaKey?: string;
  alt: string;
  /** Minimal museum-style caption. */
  caption: string;
  credit?: string;
  sourceUrl?: string;
  kind?: EssayImageKind;
  layout?: EssayImageLayout;
  /** On wide screens, selected portrait images can sit inside the prose column. */
  placement?: EssayImagePlacement;
  objectPosition?: string;
  /** Disable pointer tilt for fragile documents or already perspective-heavy art. */
  tilt?: boolean;
}

export interface EssayCitationData {
  /** Stable ids from the essay bibliography, rendered as inline source markers. */
  sourceIds?: string[];
}

export interface EssayBlockIdentity {
  /** Stable editorial identity used by citations, anchors and future migrations. */
  id?: string;
}

type EssayBlockContent =
  /** Opening epigraph — a short line/quote that sets the tone. */
  | { type: 'epigraph'; text: string; cite?: string }
  /** Large lead paragraph that opens the body. */
  | ({ type: 'lead'; text: string } & EssayCitationData)
  /** Section heading (creates an anchor for the meta-rail / TOC). */
  | { type: 'section'; heading: string; anchor?: string }
  /** A normal prose paragraph (supports \n\n splitting into multiple <p>). */
  | ({ type: 'paragraph'; text: string } & EssayCitationData)
  /** A sourced archival image or clearly labelled reconstruction. */
  | ({ type: 'image' } & EssayImageData)
  /** A big pulled quote for emphasis (a dramatic line, often the poet's own). */
  | { type: 'pullquote'; text: string; cite?: string }
  /** An embedded poem / stanza, rendered in the serif poetry style.
   *  Wrap words in **double asterisks** to render them in glowing gold.
   *  variant 'blood' tints the stanza red (for Yesenin's last poem, written in blood). */
  | { type: 'poem'; title?: string; lines: string; year?: string | number; note?: string; variant?: 'default' | 'blood' }
  /** A sourced voice: the poet himself, a friend, another poet, or a historian. */
  | {
      type: 'voice';
      quote: string;
      author: string;
      role: string;
      source: string;
      sourceUrl?: string;
      kind?: 'self' | 'friend' | 'poet' | 'historian';
    }
  /** An editorial remark from the project (the site's own sober commentary). */
  | ({ type: 'note'; text: string } & EssayCitationData)
  /** A reverent, candle-lit reflection — the site's careful spiritual/biblical
   *  meditation. Distinct warm-gold styling. Supports **gold** emphasis. */
  | { type: 'reflection'; heading?: string; text: string }
  /** A decorative divider between movements of the essay. */
  | { type: 'divider' };

export type EssayBlock = EssayBlockContent & EssayBlockIdentity;

export type EssaySourceKind = 'primary' | 'archive' | 'research' | 'institutional' | 'context';

export interface EssaySource {
  /** Canonical stable identifier used by the bibliography row. */
  id?: string;
  /**
   * Historical or essay-local identifiers that resolve to this same deduplicated
   * source. Aliases preserve old inline citations without rendering duplicate
   * bibliography cards for one URL.
   */
  aliases?: string[];
  title: string;
  url?: string;
  /** Primary text, archive/catalogue, scholarship, institutional narrative, or wider context. */
  kind?: EssaySourceKind;
  institution?: string;
  year?: string | number;
  /** One restrained sentence explaining why this source is used and what it cannot prove. */
  note?: string;
}

export interface EssaySeries {
  id: string;
  label: string;
  part: number;
  total: number;
}

export type EssayClusterRole =
  | 'pillar'
  | 'biography'
  | 'investigation'
  | 'work'
  | 'archive'
  | 'context';

export interface EssayCluster {
  /** Stable topical cluster id, shared by internally linked longreads. */
  id: string;
  /** Human-facing cluster label, e.g. “Маяковский: жизнь, тексты, архив”. */
  label: string;
  /** Editorial role inside the cluster; does not affect the visible H1. */
  role: EssayClusterRole;
  /** Stable order for cluster navigation and poet-profile cards. */
  order?: number;
}

export interface Essay {
  id: string;
  slug: string;
  /** Small eyebrow label above the title. */
  kicker?: string;
  title: string;
  subtitle?: string;
  /** Short summary for cards / default SEO. */
  excerpt: string;
  /** Search title can be more explicit than the literary page H1. */
  seoTitle?: string;
  /** Search description can differ from the on-site card excerpt. */
  seoDescription?: string;
  /** A restrained list of entities and stable search phrases. */
  seoKeywords?: string[];
  author: string;
  /** ISO-ish date string, e.g. "2026-07-12". */
  date: string;
  readTime: number;
  /** Cover image path (public/…); has a graceful gradient fallback if missing. */
  cover: string;
  /** Optional separate image for the listing link-card (falls back to `cover`). */
  cardCover?: string;
  coverAlt?: string;
  /** Provenance label for covers derived from archival material. */
  coverKind?: EssayImageKind;
  coverCredit?: string;
  coverSourceUrl?: string;
  /** Optional accent colour for this essay's hero glow (defaults to gold). */
  accent?: string;
  tags: string[];
  /** The poet this essay is primarily about, if any (links back to /poets/:id). */
  poetId?: string;
  /** Optional sequence metadata for multi-part biographies. */
  series?: EssaySeries;
  /** Optional broader SEO/editorial cluster spanning biographies and investigations. */
  cluster?: EssayCluster;
  /** Manual priority links when shared poet/cluster metadata is not sufficient. */
  relatedEssayIds?: string[];
  blocks: EssayBlock[];
  sources?: EssaySource[];
}
