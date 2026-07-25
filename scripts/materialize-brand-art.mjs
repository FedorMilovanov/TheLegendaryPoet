import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve();
const publicDir = path.join(root, 'public');
const sourceDir = path.join(root, 'src', 'brand-assets');
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const directAssets = {
  'public/favicon-16.png': 'a44d3fcaa2e4a46d5399d48b6257e4e7dee3c9a6b6bc6542ecf991d8bc280ff1',
  'public/favicon-32.png': '2c04279a8df520a3ce72188fca9ac6c71d8b78259c4779fc6d240197733c2f38',
  'public/apple-touch-icon.png': 'bbe8cf441d0f3a7099148f8668078dca47aa5ce1b7d71b305dc8413af47fc0e0',
  'public/icon-192.png': 'e4d3fa41b617680a863588f06ef8778e014bf718b7b2d6b305a2a9cde8f54a49',
  'public/mstile-150x150.png': 'b44796d8a5feb8989f3c214ef33b63667eb9c9de4c83142a400acf3c2b8f6723',
  'public/og-image.jpg': '3064016c3e3cb672a90564af224ef3ca1774bf9b883dfdcb30c6da2c3bbf8974',
};

const generatedAssets = [
  {
    output: 'public/brand-emblem-master.png',
    prefix: 'master',
    partSizes: [2000, 2000, 821],
    byteLength: 4821,
    width: 256,
    height: 256,
    hash: '4638cac0aab4b7a3bbacdd851c748ece5362e623876f717db0fdaa4feea97d6b',
  },
  {
    output: 'public/icon-512.png',
    prefix: 'icon512',
    partSizes: [2000, 2000, 2000, 2000, 955],
    byteLength: 8955,
    width: 512,
    height: 512,
    hash: 'c28d87ed099f018a01e6968cc5126f51c80c84f1e1d7fd90947737a9983c54fd',
  },
  {
    output: 'public/icon-maskable-512.png',
    prefix: 'maskable512',
    partSizes: [2000, 2000, 2000, 428],
    byteLength: 6428,
    width: 512,
    height: 512,
    hash: '634033d5512eda3f7653472ad8e0e95fa3e9fee7a8ba830c9089e589155ee411',
  },
];

function assertPng(buffer, label, width, height) {
  if (buffer.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`brand materialize: ${label} has an invalid PNG signature`);
  }
  if (buffer.length < 33 || buffer.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error(`brand materialize: ${label} has no canonical IHDR`);
  }
  if (buffer.readUInt32BE(16) !== width || buffer.readUInt32BE(20) !== height) {
    throw new Error(`brand materialize: ${label} dimensions are not ${width}x${height}`);
  }
  if (buffer.subarray(-12, -8).toString('ascii') !== 'IEND') {
    throw new Error(`brand materialize: ${label} has no terminal IEND chunk`);
  }
}

function decodeCanonicalPart(fileName, expectedSize) {
  const filePath = path.join(sourceDir, fileName);
  if (!fs.existsSync(filePath)) throw new Error(`brand materialize: missing source part ${fileName}`);
  const compact = fs.readFileSync(filePath, 'utf8').replace(/\s+/g, '');
  if (compact.length === 0 || compact.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) {
    throw new Error(`brand materialize: ${fileName} is not canonical base64`);
  }
  const bytes = Buffer.from(compact, 'base64');
  if (bytes.toString('base64') !== compact) {
    throw new Error(`brand materialize: ${fileName} failed canonical base64 round-trip`);
  }
  if (bytes.length !== expectedSize) {
    throw new Error(`brand materialize: ${fileName} decoded to ${bytes.length} B, expected ${expectedSize} B`);
  }
  return bytes;
}

if (!fs.existsSync(sourceDir)) throw new Error('brand materialize: source directory is missing');
const sourceNames = fs.readdirSync(sourceDir).sort();
const retiredParts = sourceNames.filter((name) => /^assets\.part\d+\.b64$/.test(name));
if (retiredParts.length > 0) {
  throw new Error(`brand materialize: retired LPBRAND1 archive parts remain: ${retiredParts.join(', ')}`);
}
if (fs.existsSync(path.join(publicDir, 'brand-emblem-master.webp'))) {
  throw new Error('brand materialize: retired WebP master remains');
}

const verifiedDirect = [];
for (const [relativePath, expectedHash] of Object.entries(directAssets)) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`brand materialize: missing direct asset ${relativePath}`);
  const bytes = fs.readFileSync(absolutePath);
  const actualHash = sha256(bytes);
  if (actualHash !== expectedHash) {
    throw new Error(`brand materialize: ${relativePath} SHA-256 ${actualHash} != ${expectedHash}`);
  }
  if (relativePath.endsWith('.png')) assertPng(bytes, relativePath, bytes.readUInt32BE(16), bytes.readUInt32BE(20));
  if (
    relativePath.endsWith('.jpg') &&
    (bytes.subarray(0, 3).toString('hex') !== 'ffd8ff' || bytes.subarray(-2).toString('hex') !== 'ffd9')
  ) {
    throw new Error(`brand materialize: ${relativePath} has an invalid JPEG envelope`);
  }
  verifiedDirect.push(`${relativePath} (${bytes.length} B)`);
}

const staged = [];
try {
  for (const asset of generatedAssets) {
    const expectedNames = asset.partSizes.map((_, index) => `${asset.prefix}.part${String(index + 1).padStart(2, '0')}.b64`);
    const actualNames = sourceNames.filter((name) => new RegExp(`^${asset.prefix}\\.part\\d{2}\\.b64$`).test(name));
    if (actualNames.join('\n') !== expectedNames.join('\n')) {
      throw new Error(
        `brand materialize: ${asset.prefix} source-part set changed; got [${actualNames.join(', ')}], expected [${expectedNames.join(', ')}]`,
      );
    }

    const bytes = Buffer.concat(
      expectedNames.map((fileName, index) => decodeCanonicalPart(fileName, asset.partSizes[index])),
    );
    if (bytes.length !== asset.byteLength) {
      throw new Error(`brand materialize: ${asset.output} assembled to ${bytes.length} B, expected ${asset.byteLength} B`);
    }
    const actualHash = sha256(bytes);
    if (actualHash !== asset.hash) {
      throw new Error(`brand materialize: ${asset.output} SHA-256 ${actualHash} != ${asset.hash}`);
    }
    assertPng(bytes, asset.output, asset.width, asset.height);

    const destination = path.join(root, asset.output);
    const temporary = `${destination}.tmp-${process.pid}-${crypto.randomUUID()}`;
    fs.writeFileSync(temporary, bytes, { mode: 0o644 });
    staged.push({ destination, temporary, bytes });
  }

  fs.mkdirSync(publicDir, { recursive: true });
  for (const item of staged) {
    try {
      fs.renameSync(item.temporary, item.destination);
    } catch (error) {
      if (process.platform !== 'win32') throw error;
      fs.rmSync(item.destination, { force: true });
      fs.renameSync(item.temporary, item.destination);
    }
  }
} finally {
  for (const item of staged) fs.rmSync(item.temporary, { force: true });
}

const generatedSummary = generatedAssets.map((asset) => `${asset.output} (${asset.byteLength} B)`).join(', ');
console.log(`brand assets materialized: ${generatedSummary}; direct assets verified: ${verifiedDirect.join(', ')}`);
