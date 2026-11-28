export interface CollectionSource {
  id: string;
  title: string;
  date: string;
  fragment: string;
  url: string;
  prose?: boolean;
  /** Existing canonical poem card, only after independent textual collation. */
  poemId?: string;
}

export interface PoetryCollectionEntry {
  id: string;
  poetId: string;
  poetName: string;
  title: string;
  essaySlug: string;
  sources: readonly CollectionSource[];
  video: { url: string; status: 'scheduled'; scheduledFor: string } | { url: string; status: 'published'; publishedAt: string };
}

export interface PoetryCollection {
  id: string;
  title: string;
  description: string;
  cover: string;
  coverAlt: string;
  coverCredit: string;
  playlistUrl: string;
  entries: readonly PoetryCollectionEntry[];
}
