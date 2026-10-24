import { pathToFileURL } from 'node:url';

export const HARD_LIMIT = 1000;
export const WORKING_LIMIT = 900;

export function measureStyle(style) {
  return {
    units: style.length,
    codePoints: [...style].length,
    valid: style.trim().length > 0 && style.length <= HARD_LIMIT,
    warning: style.length > WORKING_LIMIT && style.length <= HARD_LIMIT,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const chunks = [];
  let style;
  if (process.argv.length > 2) style = process.argv.slice(2).join(' ');
  else {
    for await (const chunk of process.stdin) chunks.push(chunk);
    style = Buffer.concat(chunks).toString('utf8');
  }
  const result = measureStyle(style);
  console.log(`Style: ${result.units}/${HARD_LIMIT} UTF-16 units (${result.codePoints} code points)`);
  if (!result.valid) {
    console.error('Style rejected: empty/whitespace-only or over the internal 1000-unit budget.');
    process.exitCode = 1;
  } else if (result.warning) {
    console.warn(`Style warning: exceeds the ${WORKING_LIMIT}-unit working budget.`);
  }
}
