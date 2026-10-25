import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

// Literal-only guard. No Unicode folding, accent stripping, ё restoration,
// reordering, repeats or editorial authorization can be inferred by this tool.
const sectionTag = /^\[(?:Intro|Verse(?: [1-9]\d*)?|Chorus|Pre-Chorus|Post-Chorus|Bridge|Outro|Interlude|Instrumental|Refrain|End)\]$/;
export function compareLiteralLyrics(source, lyrics, { sectionTags = false } = {}) {
  if (typeof source !== 'string' || typeof lyrics !== 'string') {
    throw new TypeError('source and lyrics must be strings');
  }
  if (!source.trim()) return { valid: false, reason: 'empty source' };
  // Only transport newline spelling is normalized; final newlines and blank
  // lines remain significant. Never silently trim or normalize Unicode.
  const original = source.replace(/\r\n/g, '\n').split('\n');
  const candidate = lyrics.replace(/\r\n/g, '\n').split('\n');
  let position = 0;
  let tags = 0;
  for (const line of candidate) {
    // Prefer an actual source line, including a literal [Verse] in a poem.
    if (position < original.length && line === original[position]) {
      position++;
    } else if (sectionTags && sectionTag.test(line)) {
      tags++;
    } else {
      return { valid: false, reason: 'line differs', sourceLine: position + 1 };
    }
  }
  if (position !== original.length) {
    return { valid: false, reason: 'missing source lines', sourceLine: position + 1 };
  }
  return { valid: true, sourceLines: original.length, tags };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length < 2 || args.length > 3 || (args.length === 3 && args[2] !== '--section-tags')) {
      throw new Error('Usage: check-suno-lyrics source.txt lyrics.txt [--section-tags]');
    }
    // Fatal decoding prevents malformed bytes in two files becoming matching �.
    const read = file => new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(fs.readFileSync(file));
    const result = compareLiteralLyrics(read(args[0]), read(args[1]), { sectionTags: args.length === 3 });
    console.log(JSON.stringify({ ...result, scope: 'literal text only; not stress/audio verification' }));
    if (!result.valid) process.exitCode = 1;
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
