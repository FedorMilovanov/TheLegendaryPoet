import fs from 'node:fs';
import path from 'node:path';
import validatorModule from 'gltf-validator';

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error('Usage: node validate-gltf.mjs <input.glb> <output.json>');
  process.exit(2);
}

const validateBytes =
  validatorModule?.validateBytes ??
  validatorModule?.default?.validateBytes;

if (typeof validateBytes !== 'function') {
  throw new Error('gltf-validator validateBytes API is unavailable');
}

const bytes = fs.readFileSync(inputPath);
const report = await validateBytes(new Uint8Array(bytes), {
  uri: path.basename(inputPath),
  maxIssues: 200,
  ignoredIssues: [],
});

const normalized = {
  schemaVersion: 1,
  input: inputPath,
  bytes: bytes.length,
  issues: {
    numErrors: report.issues?.numErrors ?? 0,
    numWarnings: report.issues?.numWarnings ?? 0,
    numInfos: report.issues?.numInfos ?? 0,
    numHints: report.issues?.numHints ?? 0,
    messages: report.issues?.messages ?? [],
  },
  validatorVersion: report.validatorVersion ?? null,
  validatedAt: new Date().toISOString(),
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);

if (normalized.issues.numErrors > 0) {
  console.error(`glTF validation failed for ${inputPath} with ${normalized.issues.numErrors} error(s)`);
  process.exit(1);
}

console.log(`glTF validation passed for ${inputPath}: ${normalized.issues.numWarnings} warning(s)`);
