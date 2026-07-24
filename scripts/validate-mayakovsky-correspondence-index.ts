import fs from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

const indexPath = path.resolve(
  'research/mayakovsky/data/correspondence-index-1-416.csv.gz',
);

const expectedHeaders = [
  'number',
  'print_page',
  'sender',
  'recipient',
  'date',
  'route',
  'document_type',
  'provenance_code',
];

const expectedGenres: Record<string, number> = {
  telegram: 230,
  letter: 134,
  note: 36,
  postcard: 14,
  inscription: 2,
};

const expectedYears: Record<string, number> = {
  '1915': 1,
  '1917': 4,
  '1918': 9,
  '1919': 1,
  '1921': 47,
  '1922': 20,
  '1923': 36,
  '1924': 32,
  '1925': 58,
  '1926': 47,
  '1927': 59,
  '1928': 60,
  '1929': 18,
  '1930': 24,
};

const expectedSenders: Record<string, number> = {
  'ВВМ': 200,
  'ЛЮБ': 163,
  'ЛЮБ, ОМБ': 27,
  'ВВМ, ОМБ': 10,
  'ОМБ': 5,
  'ВВМ, ЭТ': 2,
  'ЛЮБ, ОМБ и др.': 2,
  'ОМБ, ВВМ': 2,
  'ЭТ, ВВМ': 2,
  'ВВМ, ОМБ, ЛГ': 1,
  'ЛЮБ, ЭТ': 1,
  'ВВМ, РЯ': 1,
};

const allowedProvenanceCodes = new Set([
  'M-PHOTO-VERIFY',
  'B-TYPE-VERIFY',
  'LILI-TYPE-EXACT',
  'UNAUTH-TYPE',
  'LILI-1956-INCOMPLETE',
  'OTHER-VERIFY',
]);

const forbiddenOcrFragments = [
  'Москаа',
  'Мосйва',
  'МЬсква',
  'Леницград',
  'Ныо-Йорк',
  'Мехико-сиги',
  'Алрель',
  '3има',
  'Пароход «Эспаньв',
];

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === ',' && !quoted) {
      row.push(field);
      field = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(field);
      field = '';
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      continue;
    }

    field += char;
  }

  if (quoted) throw new Error('CSV ends inside a quoted field');
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function increment(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function mapEquals(
  actual: Map<string, number>,
  expected: Record<string, number>,
): boolean {
  const expectedEntries = Object.entries(expected).sort(([a], [b]) => a.localeCompare(b, 'ru'));
  const actualEntries = [...actual.entries()].sort(([a], [b]) => a.localeCompare(b, 'ru'));
  return JSON.stringify(actualEntries) === JSON.stringify(expectedEntries);
}

if (!fs.existsSync(indexPath)) {
  throw new Error(`Correspondence dataset is missing: ${indexPath}`);
}

const compressed = fs.readFileSync(indexPath);
const csv = gunzipSync(compressed).toString('utf8');
const rows = parseCsv(csv);
const [headers, ...records] = rows;

if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
  throw new Error(`Unexpected CSV headers: ${JSON.stringify(headers)}`);
}
if (records.length !== 416) {
  throw new Error(`Expected 416 correspondence records, found ${records.length}`);
}

const genres = new Map<string, number>();
const years = new Map<string, number>();
const senders = new Map<string, number>();
const byNumber = new Map<number, Record<string, string>>();

records.forEach((values, rowIndex) => {
  if (values.length !== headers.length) {
    throw new Error(`Row ${rowIndex + 2} has ${values.length} fields instead of ${headers.length}`);
  }
  const record = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
  const number = Number(record.number);
  const printPage = Number(record.print_page);

  if (!Number.isInteger(number) || number !== rowIndex + 1) {
    throw new Error(`Row ${rowIndex + 2} breaks sequence 1–416: ${record.number}`);
  }
  if (!Number.isInteger(printPage) || printPage < 47 || printPage > 191) {
    throw new Error(`Item ${number} has invalid print_page ${record.print_page}`);
  }

  for (const key of expectedHeaders) {
    if (!record[key]?.trim()) throw new Error(`Item ${number} has blank ${key}`);
  }
  if (!Object.hasOwn(expectedGenres, record.document_type)) {
    throw new Error(`Item ${number} has unsupported document_type ${record.document_type}`);
  }
  if (!allowedProvenanceCodes.has(record.provenance_code)) {
    throw new Error(`Item ${number} has unsupported provenance_code ${record.provenance_code}`);
  }

  const year = record.date.match(/19\d{2}/)?.[0];
  if (!year) throw new Error(`Item ${number} has no four-digit year: ${record.date}`);

  const routeGarbage = /[\^{}<>]/.test(record.route);
  if (routeGarbage) throw new Error(`Item ${number} contains OCR punctuation in route: ${record.route}`);
  for (const fragment of forbiddenOcrFragments) {
    if (`${record.date} ${record.route}`.includes(fragment)) {
      throw new Error(`Item ${number} contains forbidden OCR fragment “${fragment}”`);
    }
  }

  increment(genres, record.document_type);
  increment(years, year);
  increment(senders, record.sender);
  byNumber.set(number, record);
});

if (!mapEquals(genres, expectedGenres)) {
  throw new Error(`Genre totals changed: ${JSON.stringify(Object.fromEntries(genres))}`);
}
if (!mapEquals(years, expectedYears)) {
  throw new Error(`Year totals changed: ${JSON.stringify(Object.fromEntries(years))}`);
}
if (!mapEquals(senders, expectedSenders)) {
  throw new Error(`Literal sender totals changed: ${JSON.stringify(Object.fromEntries(senders))}`);
}

const checkpoints: Record<number, Partial<Record<string, string>>> = {
  1: { sender: 'ЛЮБ', recipient: 'ВВМ', document_type: 'telegram' },
  14: { date: 'Октябрь 1918 г.', route: 'Петроград', document_type: 'note' },
  113: { sender: 'ВВМ', recipient: 'ЛЮБ', provenance_code: 'LILI-1956-INCOMPLETE' },
  196: { route: 'Нью-Йорк–Москва', document_type: 'telegram' },
  397: { sender: 'ВВМ', recipient: 'ЛЮБ, ОМБ', document_type: 'letter' },
  407: { sender: 'ВВМ', recipient: 'ЛЮБ', provenance_code: 'LILI-TYPE-EXACT' },
  416: { sender: 'ЛЮБ, ОМБ', recipient: 'ВВМ', document_type: 'postcard' },
};

for (const [numberText, expected] of Object.entries(checkpoints)) {
  const number = Number(numberText);
  const record = byNumber.get(number);
  if (!record) throw new Error(`Checkpoint item ${number} is missing`);
  for (const [field, value] of Object.entries(expected)) {
    if (record[field] !== value) {
      throw new Error(`Checkpoint ${number}.${field}: expected “${value}”, found “${record[field]}”`);
    }
  }
}

console.log(
  `Mayakovsky correspondence index: ${records.length} rows; ` +
    `${genres.get('telegram')} telegrams, ${genres.get('letter')} letters, ` +
    `${genres.get('note')} notes, ${genres.get('postcard')} postcards, ` +
    `${genres.get('inscription')} inscriptions`,
);
