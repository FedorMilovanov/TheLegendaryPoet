import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve();
const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const expected = {
  'public/brand-emblem-master.png': '4638cac0aab4b7a3bbacdd851c748ece5362e623876f717db0fdaa4feea97d6b',
  'public/favicon-16.png': 'a44d3fcaa2e4a46d5399d48b6257e4e7dee3c9a6b6bc6542ecf991d8bc280ff1',
  'public/favicon-32.png': '2c04279a8df520a3ce72188fca9ac6c71d8b78259c4779fc6d240197733c2f38',
  'public/apple-touch-icon.png': 'bbe8cf441d0f3a7099148f8668078dca47aa5ce1b7d71b305dc8413af47fc0e0',
  'public/icon-192.png': 'e4d3fa41b617680a863588f06ef8778e014bf718b7b2d6b305a2a9cde8f54a49',
  'public/icon-512.png': 'c28d87ed099f018a01e6968cc5126f51c80c84f1e1d7fd90947737a9983c54fd',
  'public/icon-maskable-512.png': '634033d5512eda3f7653472ad8e0e95fa3e9fee7a8ba830c9089e589155ee411',
  'public/mstile-150x150.png': 'b44796d8a5feb8989f3c214ef33b63667eb9c9de4c83142a400acf3c2b8f6723',
  'public/og-image.jpg': '3064016c3e3cb672a90564af224ef3ca1774bf9b883dfdcb30c6da2c3bbf8974',
};

const verified = [];
for (const [relativePath, expectedHash] of Object.entries(expected)) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) throw new Error(`brand assets: missing ${relativePath}`);
  const bytes = fs.readFileSync(absolutePath);
  const actualHash = sha256(bytes);
  if (actualHash !== expectedHash) {
    throw new Error(`brand assets: ${relativePath} SHA-256 ${actualHash} != ${expectedHash}`);
  }
  if (relativePath.endsWith('.png') && bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`brand assets: ${relativePath} has an invalid PNG signature`);
  }
  if (
    relativePath.endsWith('.jpg') &&
    (bytes.subarray(0, 3).toString('hex') !== 'ffd8ff' || bytes.subarray(-2).toString('hex') !== 'ffd9')
  ) {
    throw new Error(`brand assets: ${relativePath} has an invalid JPEG envelope`);
  }
  verified.push(`${relativePath} (${bytes.length} B)`);
}

const sourceDir = path.join(root, 'src', 'brand-assets');
const retiredParts = fs.existsSync(sourceDir)
  ? fs.readdirSync(sourceDir).filter((name) => /^assets\.part\d+\.b64$/.test(name))
  : [];
if (retiredParts.length > 0) throw new Error(`brand assets: retired archive parts remain: ${retiredParts.join(', ')}`);
if (fs.existsSync(path.join(root, 'public', 'brand-emblem-master.webp'))) {
  throw new Error('brand assets: retired WebP master remains');
}

console.log(`brand assets verified: ${verified.join(', ')}`);
