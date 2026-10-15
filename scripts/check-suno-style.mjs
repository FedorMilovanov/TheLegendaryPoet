const HARD_LIMIT = 1000;
const WORKING_LIMIT = 900;

const readStdin = async () => {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
};

const positional = process.argv.slice(2);
const style = positional.length > 0 ? positional.join(' ') : await readStdin();
const uiUnits = style.length;
const codePoints = [...style].length;

if (uiUnits === 0) {
  console.error('SUNO Style check failed: no Style text received');
  process.exit(1);
}

const unicodeNote = uiUnits === codePoints ? '' : ` (${codePoints} Unicode code points)`;
console.log(`Style: ${uiUnits}/${HARD_LIMIT}${unicodeNote}`);

if (uiUnits > HARD_LIMIT) {
  console.error(
    `SUNO Style check failed: exceeds the hard limit by ${uiUnits - HARD_LIMIT} UTF-16 code unit(s)`,
  );
  process.exit(1);
}

if (uiUnits > WORKING_LIMIT) {
  console.warn(
    `SUNO Style warning: ${uiUnits}/${HARD_LIMIT}; compress below the ${WORKING_LIMIT}-character working budget`,
  );
}
