from pathlib import Path

path = Path('src/data/essays/yeseninKutezhi.ts')
text = path.read_text(encoding='utf-8')

rules = [
    ('Дурная слава не свалилась на Есенина только извне.', 'yesenin-imagism'),
    ('После возвращения заграничный скандализм быстро получил документальное продолжение', 'yesenin-police-records'),
    ('«Чёрный человек» складывался не в одну ночь:', 'yesenin-black-man-dating'),
    ('Последний год Есенина состоял не только из срывов.', 'yesenin-last-year'),
    ('С 26 ноября по 21 декабря 1925 года Есенин находился', 'yesenin-clinic'),
    ('Там, в ночь с 27 на 28 декабря 1925 года, он покончил с собой.', 'yesenin-death-account'),
    ('В «Инонии» и в переданных Блоком словах зафиксирован', 'yesenin-inonia-assessment'),
    ('Совокупность собственных слов Есенина не оставляет основания', 'yesenin-religious-self-definition'),
    ('О смерти нужно говорить по документам.', 'yesenin-death-documents'),
]

for marker, block_id in rules:
    marker_index = text.find(marker)
    if marker_index < 0:
        raise SystemExit(f'marker not found: {marker}')
    brace_index = text.rfind('{\n', 0, marker_index)
    if brace_index < 0:
        raise SystemExit(f'object start not found: {marker}')
    line_start = text.rfind('\n', 0, brace_index) + 1
    indent = text[line_start:brace_index]
    insert_at = brace_index + len('{\n')
    prefix = text[insert_at:marker_index]
    if f"id: '{block_id}'" in prefix:
        continue
    if "id: '" in prefix:
        raise SystemExit(f'block already has another id: {marker}')
    text = text[:insert_at] + f"{indent}  id: '{block_id}',\n" + text[insert_at:]

path.write_text(text, encoding='utf-8')
