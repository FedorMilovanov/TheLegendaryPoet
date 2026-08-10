#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const acquisitionPath = path.join(root, 'docs/hall-v3/pushkin-acquisition.json');
const ownerPath = path.join(root, 'docs/hall-v3/pushkin-owner-disposition.json');
const outputDir = path.resolve(process.argv[2] ?? path.join(root, 'qa-artifacts/hall-pushkin-offline/sources'));

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const sha256 = (bytes) => `sha256:${crypto.createHash('sha256').update(bytes).digest('hex')}`;
const fail = (message) => { throw new Error(message); };

const downloadExact = async (asset, outputName) => {
  const url = new URL(asset.originalFileUrl);
  if (url.protocol !== 'https:' || url.hostname !== 'upload.wikimedia.org') fail(`${asset.assetId}: source host must remain upload.wikimedia.org`);
  const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'TheLegendaryPoet-HallV3-offline-evidence/1.0' } });
  if (!response.ok) fail(`${asset.assetId}: source download failed: ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const actual = sha256(bytes);
  if (actual !== asset.sourceFileHash) fail(`${asset.assetId}: source hash mismatch: ${actual} != ${asset.sourceFileHash}`);
  const output = path.join(outputDir, outputName);
  fs.writeFileSync(output, bytes);
  return { assetId: asset.assetId, requestedUrl: url.href, finalUrl: response.url, byteCount: bytes.byteLength, sha256: actual, file: outputName };
};

const pngDimensions = (file) => {
  const bytes = fs.readFileSync(file);
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  if (!bytes.subarray(0, 8).equals(signature)) fail(`not a PNG: ${file}`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
};

const main = async () => {
  const acquisition = readJson(acquisitionPath);
  const owner = readJson(ownerPath);
  if (owner.status !== 'owner-offline-authoring-authorized' || owner.offlineAuthoring?.authorized !== true) fail('owner offline-authoring authority is not active');
  if (owner.offlineAuthoring?.productionShippingAuthorizedByThisDecision !== false) fail('offline source preparation may not imply production shipping');
  if (acquisition.currentOutcome?.offlineBlenderSourceEvidenceAllowed !== true) fail('acquisition authority does not allow offline Blender source evidence');

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });

  const byId = new Map((acquisition.assets ?? []).map((asset) => [asset.assetId, asset]));
  const ownerById = new Map((owner.offlineAuthoring?.assets ?? []).map((asset) => [asset.assetId, asset]));
  const portrait = byId.get('pushkin-kiprensky-1827-portrait');
  const onegin = byId.get('pushkin-onegin-1833-edition');
  if (!portrait?.offlineAuthoringAuthorized || !onegin?.offlineAuthoringAuthorized) fail('portrait and Onegin must be explicitly authorized for offline authoring');
  if (ownerById.get(portrait.assetId)?.sourceFileHash !== portrait.sourceFileHash) fail('portrait owner/source hash authority drifted');
  if (ownerById.get(onegin.assetId)?.sourceFileHash !== onegin.sourceFileHash) fail('Onegin owner/source hash authority drifted');
  if (onegin.selectedOfflineSourcePdfPageIndex !== 0 || ownerById.get(onegin.assetId)?.selectedOfflinePresentation?.sourcePdfPageIndex !== 0) fail('Onegin offline presentation must remain source PDF page index 0');

  const portraitEvidence = await downloadExact(portrait, 'kiprensky-1827-source.jpg');
  const portraitBytes = fs.readFileSync(path.join(outputDir, portraitEvidence.file));
  if (!(portraitBytes[0] === 0xff && portraitBytes[1] === 0xd8 && portraitBytes[2] === 0xff)) fail('Kiprensky source is not a JPEG');

  const oneginEvidence = await downloadExact(onegin, 'onegin-1833-source.pdf');
  const oneginBytes = fs.readFileSync(path.join(outputDir, oneginEvidence.file));
  if (oneginBytes.subarray(0, 4).toString('ascii') !== '%PDF') fail('Onegin source is not a PDF');

  const pdfPath = path.join(outputDir, oneginEvidence.file);
  const pdfInfo = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
  const pageMatch = pdfInfo.match(/^Pages:\s+(\d+)$/m);
  if (!pageMatch || Number(pageMatch[1]) !== 324) fail(`Onegin PDF page identity drifted: ${pageMatch?.[1] ?? 'unknown'}`);

  const pageStem = path.join(outputDir, 'onegin-1833-title-page');
  execFileSync('pdftoppm', ['-f', '1', '-singlefile', '-png', '-r', '240', pdfPath, pageStem], { stdio: 'inherit' });
  const titlePage = `${pageStem}.png`;
  if (!fs.existsSync(titlePage)) fail('Onegin title-page derivative was not produced');
  const titleBytes = fs.readFileSync(titlePage);
  const titleDimensions = pngDimensions(titlePage);
  // The historical scan is raster. Require enough pixels for the 720p evidence crop,
  // but do not invent additional historical detail by escalating DPI merely to satisfy a number.
  if (Math.min(...titleDimensions) < 1000) fail(`Onegin title-page derivative is too small for close offline evidence: ${titleDimensions.join('x')}`);

  const evidence = {
    schemaVersion: 1,
    laneId: 'TLP-HALL-001',
    phase: 'pushkinVerticalSlice',
    purpose: 'offline-source-evidence-only-not-production-media',
    sourceAuthority: 'docs/hall-v3/pushkin-acquisition.json',
    ownerAuthority: 'docs/hall-v3/pushkin-owner-disposition.json',
    sources: [portraitEvidence, oneginEvidence],
    derivatives: [{
      assetId: 'pushkin-onegin-1833-title-page-offline-derivative',
      sourceAssetId: onegin.assetId,
      sourcePdfPageIndex: 0,
      renderer: 'pdftoppm',
      dpi: 240,
      file: path.basename(titlePage),
      byteCount: titleBytes.byteLength,
      dimensions: titleDimensions,
      sha256: sha256(titleBytes),
      productionEligible: false,
    }],
    productionManifestAllowed: false,
  };
  fs.writeFileSync(path.join(outputDir, 'source-assets-evidence.json'), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(`Prepared exact Pushkin offline sources: portrait ${portraitEvidence.byteCount} bytes; Onegin ${oneginEvidence.byteCount} bytes; title page ${titleDimensions.join('x')}.`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
