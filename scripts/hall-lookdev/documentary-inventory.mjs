/** Require both separately authorized documentary images in the offline candidate. */
export function requireDocumentaryImages(sourceAssets, images) {
  const portraitSources = (sourceAssets.sources ?? []).filter(item => item.assetId === 'pushkin-kiprensky-1827-portrait');
  const oneginDerivatives = (sourceAssets.derivatives ?? []).filter(item => item.assetId === 'pushkin-onegin-1833-title-page-offline-derivative');
  if (portraitSources.length !== 1 || oneginDerivatives.length !== 1) throw new Error('documentary source identity is missing or ambiguous');
  const portraitHash = portraitSources[0].sha256;
  const oneginHash = oneginDerivatives[0].sha256;
  if (![portraitHash, oneginHash].every(hash => /^sha256:[a-f0-9]{64}$/.test(hash ?? '')) || portraitHash === oneginHash) {
    throw new Error('documentary sources must have two distinct exact SHA-256 identities');
  }
  const documentaryHashes = new Set([portraitHash, oneginHash]);
  const documentaryImages = images.filter(item => documentaryHashes.has(item.sha256));
  for (const [label, hash] of [['Kiprensky portrait', portraitHash], ['Onegin title page', oneginHash]]) {
    if (documentaryImages.filter(item => item.sha256 === hash).length !== 1) throw new Error(`optimized candidate must retain exactly one ${label}`);
  }
  return { documentaryHashes, documentaryImages };
}
