import { createHash } from 'node:crypto';

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function validSlug(value) {
  return typeof value === 'string' && value.length <= 96 && slugPattern.test(value);
}
function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

// A review is bound to the exact text and epigraph, not to the title or age
// of the author. Analysis/source verification is a separate editorial gate.
export function poemTextDigest(poem) {
  return createHash('sha256').update(JSON.stringify([
    poem.text, poem.epigraph ? [poem.epigraph.text, poem.epigraph.attribution] : null,
  ]), 'utf8').digest('hex');
}

export function buildPoemRouteCatalog(poets, policy, canonicalRoutePath) {
  if (policy?.schemaVersion !== 1 || !object(policy.authors) || !object(policy.reviews)) {
    throw new Error('Invalid poem route policy schema');
  }
  const poetIds = new Set();
  const workIds = new Set();
  const consumed = new Set();
  const paths = new Set();
  const catalog = [];
  for (const poet of poets) {
    if (!validSlug(poet.id) || poetIds.has(poet.id)) throw new Error('Invalid or duplicate author ID: ' + poet.id);
    poetIds.add(poet.id);
    const slugs = Object.hasOwn(policy.authors, poet.id) ? policy.authors[poet.id] : {};
    if (!object(slugs)) throw new Error('Invalid author slug registry: ' + poet.id);
    const authored = new Set();
    for (const poem of poet.poems) {
      if (!validSlug(poem.id) || workIds.has(poem.id)) throw new Error('Invalid or duplicate work ID: ' + poem.id);
      workIds.add(poem.id);
      authored.add(poem.id);
      const slug = Object.hasOwn(slugs, poem.id) ? slugs[poem.id] : undefined;
      if (slug !== undefined && !validSlug(slug)) throw new Error('Invalid work slug: ' + poem.id);
      const candidatePath = slug === undefined ? null : canonicalRoutePath('/poets/' + poet.id + '/' + slug);
      if (candidatePath !== null) {
        if (paths.has(candidatePath)) throw new Error('Duplicate poem route: ' + candidatePath);
        paths.add(candidatePath);
      }
      const review = Object.hasOwn(policy.reviews, poem.id) ? policy.reviews[poem.id] : undefined;
      let reason = slug === undefined ? 'slug-not-assigned' : 'rights-and-edition-review-required';
      let scope = 'unreviewed';
      let eligible = false;
      if (review !== undefined) {
        consumed.add(poem.id);
        if (!object(review) || !['hold', 'approved'].includes(review.decision)
          || !['full', 'excerpt'].includes(review.scope) || typeof review.reason !== 'string' || !review.reason.trim()
          || !Array.isArray(review.evidence) || !review.evidence.length
          || review.evidence.some(item => typeof item !== 'string' || !item.trim())) {
          throw new Error('Invalid work review: ' + poem.id);
        }
        scope = review.scope;
        reason = review.reason;
        if (review.decision === 'approved') {
          if (!candidatePath || !/^[0-9a-f]{64}$/.test(review.textSha256 ?? '')
            || review.textSha256 !== poemTextDigest(poem)
            || typeof review.rightsBasis !== 'string' || !review.rightsBasis.trim()
            || typeof review.reviewedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn)
            || !poem.sourceUrl || !poem.analysis?.trim() || !poem.text?.trim()) {
            throw new Error('Incomplete or stale standalone publication approval: ' + poem.id);
          }
          eligible = true;
        }
      }
      catalog.push({ poetId: poet.id, poemId: poem.id, slug: slug ?? null,
        candidatePath, legacyPath: canonicalRoutePath('/poets/' + poet.id) + '#poem-' + poem.id,
        scope, eligible, reason, poet, poem });
    }
    for (const id of Object.keys(slugs)) {
      if (!authored.has(id)) throw new Error('Orphan work slug: ' + poet.id + '/' + id);
    }
  }
  for (const id of Object.keys(policy.authors)) {
    if (!poetIds.has(id)) throw new Error('Orphan author slug registry: ' + id);
  }
  for (const id of Object.keys(policy.reviews)) {
    if (!consumed.has(id)) throw new Error('Orphan work review: ' + id);
  }
  return catalog;
}
