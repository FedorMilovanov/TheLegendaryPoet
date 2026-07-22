#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
import subprocess
import tempfile
from collections import Counter
from pathlib import Path

EXPECTED_GENRES = {
    'telegram': 230,
    'letter': 134,
    'note': 36,
    'postcard': 14,
    'inscription': 2,
}
EXPECTED_YEARS = {
    1915: 1,
    1917: 4,
    1918: 9,
    1919: 1,
    1921: 47,
    1922: 20,
    1923: 36,
    1924: 32,
    1925: 58,
    1926: 47,
    1927: 59,
    1928: 60,
    1929: 18,
    1930: 24,
}

# Only page-confirmed OCR failures and punctuation debris are normalized here.
MANUAL_HEADERS = {
    14: '14. ВВМ, ОМБ-ЛЮБ <Октябрь 1918 г. Петроград>',
    115: '115. ЛЮБ-ВВМ <Весна 1923 г. (?) Москва>',
    118: '118. ВВМ-ЛЮБ <1923 г. (?) Москва>',
    188: '188. ЛЮБ-ВВМ <Нач. октября 1925 г. Москва-Нью-Йорк>',
    194: '194. ВВМ-ЛЮБ <16 октября 1925 г. Нью-Йорк-Москва>',
    196: '196. ВВМ-ЛЮБ <19 октября 1925 г. Нью-Йорк-Москва>',
    264: '264. ЛЮБ-ВВМ, ОМБ <4 февраля 1927 г. Вена-Москва>',
    317: '317. ВВМ-ЛЮБ <29 января 1928 г. Свердловск-Москва>',
    368: '368. ЛЮБ-ВВМ <2 ноября 1928 г. Москва-Париж>',
    411: '411. ВВМ-ЛЮБ, ОМБ <28 марта 1930 г. Москва-Берлин>',
}

# Manual classifications are limited to entries not safely classified from the
# opening lines of the textual commentary. The six formerly unresolved entries
# are 87, 91, 132, 134, 150, and 177; the others below belong to the special
# short-note block 81–113 and were verified by visible form and apparatus.
MANUAL_TYPES = {
    85: 'note',
    87: 'letter',
    88: 'note',
    90: 'note',
    91: 'inscription',
    92: 'note',
    95: 'note',
    96: 'note',
    98: 'note',
    100: 'note',
    101: 'note',
    102: 'note',
    108: 'note',
    110: 'note',
    111: 'note',
    112: 'note',
    132: 'note',
    134: 'inscription',
    150: 'letter',
    177: 'telegram',
}

PROVENANCE_CODES = {
    'mayakovsky': 'M-PHOTO-VERIFY',
    'brik': 'B-TYPE-VERIFY',
    'lili_exact': 'LILI-TYPE-EXACT',
    'unauthorized': 'UNAUTH-TYPE',
    'lili_1956': 'LILI-1956-INCOMPLETE',
    'other': 'OTHER-VERIFY',
}

SPECIAL_LILI_EXACT = {15, 16, 17, 114, 131, 397, 407}
SPECIAL_UNAUTHORIZED = {76, 82, 89, 93, 94, 99, 103, 105, 107}


def pdf_to_text(pdf: Path) -> str:
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as handle:
        target = Path(handle.name)
    try:
        result = subprocess.run(
            ['pdftotext', '-layout', str(pdf), str(target)],
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            raise RuntimeError(f'pdftotext failed: {result.stderr.strip()}')
        return target.read_text(encoding='utf-8', errors='replace')
    finally:
        target.unlink(missing_ok=True)


def parse_comments(pages: list[str]) -> dict[int, str]:
    lines = '\n'.join(pages[226:304]).splitlines()
    headings: list[tuple[int, int]] = []
    for index, line in enumerate(lines):
        match = re.match(r'^\s*(\d{1,3})\.\s*$', line)
        if match:
            headings.append((int(match.group(1)), index))

    comments: dict[int, str] = {}
    for idx, (number, start) in enumerate(headings):
        end = headings[idx + 1][1] if idx + 1 < len(headings) else len(lines)
        comments[number] = '\n'.join(lines[start + 1:end]).strip()
    return comments


def find_headers(pages: list[str]) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    expected = 1

    for page_index in range(47, 225):
        lines = pages[page_index].splitlines()
        for line_index, line in enumerate(lines):
            if expected > 416:
                break

            raw = line.strip()
            number: int | None = None
            match = re.match(r'^(\d{1,3})\.\s+[«“]?[А-ЯЁA-Z]', raw)
            if match:
                number = int(match.group(1))
            elif expected == 188 and '188.. ЛЮБ-ВВМ' in raw:
                number = 188
            elif expected == 264 and raw.startswith('I 264.'):
                number = 264
            elif expected == 317 and raw.startswith('3Î7.'):
                number = 317
            elif expected == 368 and raw.startswith('i|368.'):
                number = 368
            elif expected == 411 and raw.startswith('41L '):
                number = 411

            if number != expected:
                continue

            raw_header = (
                ' | '.join(lines[line_index:line_index + 3]).strip()
                if number == 264
                else raw
            )
            entries.append(
                {
                    'number': number,
                    'print_page': page_index,
                    'pdf_page': page_index + 1,
                    'raw_header': raw_header,
                    'normalized_header': MANUAL_HEADERS.get(number, raw),
                }
            )
            expected += 1

    numbers = [int(entry['number']) for entry in entries]
    if numbers != list(range(1, 417)):
        missing = sorted(set(range(1, 417)) - set(numbers))
        raise ValueError(f'Header sequence is incomplete; missing={missing}')
    return entries


def normalize_route(route: str) -> str:
    route = (
        route.replace('Москаа', 'Москва')
        .replace('Мосйва', 'Москва')
        .replace('МЬсква', 'Москва')
        .replace('Вёна', 'Вена')
        .replace('Леницград', 'Ленинград')
        .replace('Ныо-Йорк', 'Нью-Йорк')
        .replace('Мехико-сиги', 'Мехико-Сити')
        .replace('Мехико-сити', 'Мехико-Сити')
        .replace('Пароход «Эспаньв-Москва/', 'Пароход «Эспань»–Москва')
        .replace('Пароход «Эспань»-Москва>*', 'Пароход «Эспань»–Москва')
        .replace('Пароход «Эспань»-Москва', 'Пароход «Эспань»–Москва')
    )
    route = route.rstrip('/>* хг^}').replace('-', '–').strip()
    return route.replace('Нью–Йорк', 'Нью-Йорк').replace('Мехико–Сити', 'Мехико-Сити')


def parse_header(entry: dict[str, object]) -> None:
    header = str(entry['normalized_header'])
    match = re.match(r'^(\d+)\.\s*(.*?)\s*[<«(]\s*(.*?)[>)»]?\s*$', header)
    if not match:
        cleaned = re.sub(r'[>)]?[1хг]\s*$', '>', header)
        match = re.match(r'^(\d+)\.\s*(.*?)\s*[<«(]\s*(.*?)[>)»]?\s*$', cleaned)
    if not match:
        raise ValueError((entry['number'], header))

    direction = match.group(2).strip(' «“')
    temporal = re.sub(r'[>)»]?[1хг]\s*$', '', match.group(3).strip()).strip()
    date_match = re.match(r'^(.*?\bг\.)\s*(.*)$', temporal)
    if date_match:
        date = date_match.group(1).strip()
        route = date_match.group(2).strip(' )>»')
    else:
        date, route = temporal, ''

    sender, recipient = direction.split('-', 1) if '-' in direction else (direction, '')
    date = date.replace('Алрель', 'Апрель').replace('0к.', 'Ок.').replace('3има', 'Зима')

    # In these uncertain headings the question mark belongs to the editorial
    # date, not to the geographical route.
    if route.startswith('(?) '):
        date = f'{date} (?)'
        route = route[4:]

    entry.update(
        direction=direction,
        sender=sender.strip(),
        recipient=recipient.strip(),
        date=date.strip(' ('),
        route=normalize_route(route),
    )


def type_from_comment(comment: str) -> str:
    first = ' '.join(comment.splitlines()[:8]).lower()
    patterns = [
        ('postcard', r'открытк|почтов[а-я]+ карточ'),
        ('telegram', r'телеграмм'),
        ('note', r'записк'),
        ('letter', r'письм'),
    ]
    for document_type, pattern in patterns:
        if re.search(pattern, first):
            return document_type
    return 'unclassified'


def provenance(number: int, sender: str) -> str:
    if number in SPECIAL_LILI_EXACT:
        return PROVENANCE_CODES['lili_exact']
    if number in SPECIAL_UNAUTHORIZED:
        return PROVENANCE_CODES['unauthorized']
    if number == 113:
        return PROVENANCE_CODES['lili_1956']
    if 'ВВМ' in sender:
        return PROVENANCE_CODES['mayakovsky']
    if 'ЛЮБ' in sender or 'ОМБ' in sender:
        return PROVENANCE_CODES['brik']
    return PROVENANCE_CODES['other']


def validate(entries: list[dict[str, object]]) -> None:
    genre_counts = Counter(str(entry['document_type']) for entry in entries)
    if dict(genre_counts) != EXPECTED_GENRES:
        raise ValueError(f'Unexpected genre totals: {dict(genre_counts)}')

    year_counts: Counter[int] = Counter()
    for entry in entries:
        match = re.search(r'(19\d{2})', str(entry['date']))
        if not match:
            raise ValueError(f'Missing year in item {entry["number"]}: {entry["date"]!r}')
        year_counts[int(match.group(1))] += 1
        for field in (
            'sender',
            'recipient',
            'date',
            'route',
            'document_type',
            'provenance_code',
        ):
            if not str(entry[field]).strip():
                raise ValueError(f'Blank {field} in item {entry["number"]}')

    if dict(sorted(year_counts.items())) != EXPECTED_YEARS:
        raise ValueError(f'Unexpected year totals: {dict(sorted(year_counts.items()))}')

    checkpoints = {
        1: ('ЛЮБ', 'ВВМ', 'telegram'),
        113: ('ВВМ', 'ЛЮБ', 'letter'),
        397: ('ВВМ', 'ЛЮБ, ОМБ', 'letter'),
        416: ('ЛЮБ, ОМБ', 'ВВМ', 'postcard'),
    }
    by_number = {int(entry['number']): entry for entry in entries}
    for number, expected in checkpoints.items():
        actual = by_number[number]
        got = (actual['sender'], actual['recipient'], actual['document_type'])
        if got != expected:
            raise ValueError(f'Checkpoint {number}: expected {expected}, got {got}')


def write_csv(entries: list[dict[str, object]], output: Path) -> None:
    fields = [
        'number',
        'print_page',
        'sender',
        'recipient',
        'date',
        'route',
        'document_type',
        'provenance_code',
    ]
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows({field: entry[field] for field in fields} for entry in entries)


def main() -> None:
    parser = argparse.ArgumentParser(
        description='Build the metadata-only index of Jangfeldt correspondence items 1–416.'
    )
    parser.add_argument('pdf', type=Path, help='Path to the 1991 Jangfeldt correspondence PDF')
    parser.add_argument('-o', '--output', type=Path, required=True, help='Output CSV path')
    args = parser.parse_args()

    if not args.pdf.is_file():
        raise SystemExit(f'PDF not found: {args.pdf}')

    pages = pdf_to_text(args.pdf).split('\f')
    comments = parse_comments(pages)
    entries = find_headers(pages)
    for entry in entries:
        parse_header(entry)
        number = int(entry['number'])
        document_type = type_from_comment(comments.get(number, ''))
        if number in MANUAL_TYPES:
            document_type = MANUAL_TYPES[number]
        entry['document_type'] = document_type
        entry['provenance_code'] = provenance(number, str(entry['sender']))

    validate(entries)
    write_csv(entries, args.output)
    print(f'Wrote {len(entries)} rows to {args.output}')
    print('Genres:', dict(Counter(str(entry['document_type']) for entry in entries)))


if __name__ == '__main__':
    main()
