import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const [validatorBin, inputPath, outputPath] = process.argv.slice(2);
if (!validatorBin || !inputPath || !outputPath) {
  console.error('Usage: node validate-gltf.mjs <gltf_validator-bin> <input.glb> <output.json>');
  process.exit(2);
}

if (!fs.existsSync(validatorBin)) {
  throw new Error(`Khronos validator binary does not exist: ${validatorBin}`);
}
if (!fs.existsSync(inputPath)) {
  throw new Error(`GLB input does not exist: ${inputPath}`);
}

const result = spawnSync(validatorBin, ['-r', '-a', '-o', inputPath], {
  encoding: 'utf8',
  maxBuffer: 32 * 1024 * 1024,
});

if (result.error) throw result.error;
if (!result.stdout?.trim()) {
  console.error(result.stderr ?? '');
  throw new Error(`Khronos validator produced no JSON report for ${inputPath}`);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch (error) {
  console.error(result.stdout);
  console.error(result.stderr ?? '');
  throw new Error(`Khronos validator stdout was not JSON for ${inputPath}: ${error instanceof Error ? error.message : String(error)}`);
}

const normalized = {
  ...report,
  _hallWitness: {
    schemaVersion: 1,
    input: inputPath,
    bytes: fs.statSync(inputPath).size,
    validatorBinary: path.basename(validatorBin),
    exitStatus: result.status,
    zeroWarningGate: true,
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(normalized, null, 2)}\n`);

const errors = report.issues?.numErrors ?? 0;
const warnings = report.issues?.numWarnings ?? 0;
if (result.status !== 0 || errors > 0 || warnings > 0) {
  console.error(result.stderr ?? '');
  console.error(`glTF validation failed Hall zero-warning gate for ${inputPath}: exit=${result.status}, errors=${errors}, warnings=${warnings}`);
  for (const issue of report.issues?.messages ?? []) {
    if ((issue.severity ?? 99) <= 1) console.error(`- ${issue.code}: ${issue.message}`);
  }
  process.exit(result.status || 1);
}

if (result.stderr?.trim()) console.log(result.stderr.trim());
console.log(`Khronos glTF zero-warning validation passed for ${inputPath}`);
