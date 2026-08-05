import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const artifacts = [
  {
    path: 'public/sitemap.xml',
    generator: 'sitemap',
  },
  {
    path: 'public/feed.xml',
    generator: 'feed',
  },
];

const originals = new Map();
for (const artifact of artifacts) {
  const absolutePath = path.join(root, artifact.path);
  originals.set(artifact.path, fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : null);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const failures = [];

function runGenerator(scriptName) {
  const result = spawnSync(npmCommand, ['run', '--silent', scriptName], {
    cwd: root,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    const diagnostics = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(`npm run ${scriptName} failed${diagnostics ? `:\n${diagnostics}` : ''}`);
  }
}

try {
  for (const artifact of artifacts) runGenerator(artifact.generator);

  for (const artifact of artifacts) {
    const absolutePath = path.join(root, artifact.path);
    const original = originals.get(artifact.path);
    const generated = fs.existsSync(absolutePath) ? fs.readFileSync(absolutePath) : null;

    if (original === null) {
      failures.push(`${artifact.path} is generated but not committed`);
      continue;
    }

    if (generated === null || !original.equals(generated)) {
      failures.push(`${artifact.path} is stale relative to its canonical source data`);
    }
  }
} finally {
  for (const artifact of artifacts) {
    const absolutePath = path.join(root, artifact.path);
    const original = originals.get(artifact.path);

    if (original === null) {
      fs.rmSync(absolutePath, { force: true });
    } else {
      fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
      fs.writeFileSync(absolutePath, original);
    }
  }
}

if (failures.length > 0) {
  console.error('Committed discovery artifact validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  console.error('Regenerate and commit the canonical files with: npm run sitemap && npm run feed');
  process.exit(1);
}

console.log(`Committed discovery artifacts are current: ${artifacts.map((artifact) => artifact.path).join(', ')}.`);
