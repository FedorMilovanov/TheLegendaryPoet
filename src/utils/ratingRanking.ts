export type ReaderRankingSource = {
  id: string;
  name: string;
  readerScore: number | null;
  votes: number;
};

export type EditorialRankingSource = {
  id: string;
  name: string;
  editorialScore: number;
};

function stableIdentity(left: { id: string; name: string }, right: { id: string; name: string }) {
  return left.name.localeCompare(right.name, 'ru') || left.id.localeCompare(right.id);
}

/**
 * Reader places are owned only by reader-derived facts.
 * `editorialScore` is intentionally absent from ReaderRankingSource so an
 * editorial /10 value cannot become a reader /5 tie-break accidentally.
 */
export function compareReaderRankingRows(left: ReaderRankingSource, right: ReaderRankingSource) {
  const leftRated = left.readerScore !== null && left.votes > 0;
  const rightRated = right.readerScore !== null && right.votes > 0;

  if (leftRated !== rightRated) return leftRated ? -1 : 1;

  if (leftRated && rightRated) {
    const scoreOrder = (right.readerScore ?? 0) - (left.readerScore ?? 0);
    if (scoreOrder) return scoreOrder;
    const voteOrder = right.votes - left.votes;
    if (voteOrder) return voteOrder;
  }

  return stableIdentity(left, right);
}

/** Editorial /10 ordering remains an explicit, separate mode. */
export function compareEditorialRankingRows(left: EditorialRankingSource, right: EditorialRankingSource) {
  return right.editorialScore - left.editorialScore || stableIdentity(left, right);
}
