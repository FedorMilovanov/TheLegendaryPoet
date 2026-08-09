import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  if (index === -1 || index + 1 >= args.length) throw new Error(`Missing ${name}`);
  return args[index + 1];
};

const input = path.resolve(value('--input'));
const output = path.resolve(value('--output'));
const toolRoot = path.resolve(value('--tool-root'));
const requireFromTools = createRequire(path.join(toolRoot, 'resolver.cjs'));
const validator = requireFromTools('gltf-validator');
const bytes = new Uint8Array(fs.readFileSync(input));
const report = await validator.validateBytes(bytes, {
  uri: path.basename(input),
  maxIssues: 1000,
  ignoredIssues: [],
  severityOverrides: {},
});

const lockPath = path.join(toolRoot, 'package-lock.json');
if (!fs.existsSync(lockPath)) throw new Error(`Missing isolated tool lock: ${lockPath}`);
const lockBytes = fs.readFileSync(lockPath);
const lock = JSON.parse(lockBytes.toString('utf8'));
const lockEntry = (name) => lock?.packages?.[`node_modules/${name}`] ?? lock?.dependencies?.[name] ?? null;
const packageMetadata = (name) => {
  const packageJson = requireFromTools(`${name}/package.json`);
  const entry = lockEntry(name);
  if (!entry) throw new Error(`Missing ${name} entry in isolated tool lock`);
  return {
    version: String(packageJson.version),
    resolved: String(entry.resolved ?? ''),
    integrity: String(entry.integrity ?? ''),
  };
};
report._hallToolchain = {
  schemaVersion: 1,
  node: process.version,
  packageLockSha256: crypto.createHash('sha256').update(lockBytes).digest('hex'),
  gltfValidator: packageMetadata('gltf-validator'),
  gltfpack: packageMetadata('gltfpack'),
};

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
const errors = Number(report?.issues?.numErrors ?? 0);
const warnings = Number(report?.issues?.numWarnings ?? 0);
const infos = Number(report?.issues?.numInfos ?? 0);
console.log(`glTF validation: ${path.basename(input)} errors=${errors} warnings=${warnings} infos=${infos} lock=${report._hallToolchain.packageLockSha256.slice(0, 12)}`);
if (errors > 0) process.exit(1);
