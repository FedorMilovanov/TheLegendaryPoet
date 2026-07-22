from pathlib import Path

source_path = Path('scripts/migrate-essay-rules-to-block-ids.py')
source = source_path.read_text(encoding='utf-8')

old_object_function = '''def add_object_id(path: str, marker: str, block_id: str) -> None:
    text = read(path)
    marker_index = text.find(marker)
    if marker_index < 0:
        raise SystemExit(f'{path}: marker not found: {marker}')

    object_start = text.rfind('    {\\n', 0, marker_index)
    if object_start < 0:
        raise SystemExit(f'{path}: object start not found for {marker}')
    insert_at = object_start + len('    {\\n')
    object_prefix = text[insert_at:marker_index]
    if "id: '" in object_prefix:
        return
    text = text[:insert_at] + f"      id: '{block_id}',\\n" + text[insert_at:]
    write(path, text)
'''

new_object_function = '''def add_object_id(path: str, marker: str, block_id: str) -> None:
    text = read(path)
    marker_index = text.find(marker)
    if marker_index < 0:
        raise SystemExit(f'{path}: marker not found: {marker}')

    brace_index = text.rfind('{\\n', 0, marker_index)
    if brace_index < 0:
        raise SystemExit(f'{path}: object start not found for {marker}')
    line_start = text.rfind('\\n', 0, brace_index) + 1
    indent = text[line_start:brace_index]
    if indent.strip():
        raise SystemExit(f'{path}: malformed object indentation for {marker}')
    insert_at = brace_index + len('{\\n')
    object_prefix = text[insert_at:marker_index]
    if "id: '" in object_prefix:
        return
    text = text[:insert_at] + f"{indent}  id: '{block_id}',\\n" + text[insert_at:]
    write(path, text)
'''

old_section_function = '''def add_inline_section_id(path: str, heading: str, block_id: str) -> None:
    text = read(path)
    old = f"{{ type: 'section', heading: '{heading}' }}"
    new = f"{{ id: '{block_id}', type: 'section', heading: '{heading}' }}"
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'{path}: inline section not found: {heading}')
    write(path, text.replace(old, new, 1))
'''

new_section_function = '''def add_section_id(path: str, heading: str, block_id: str) -> None:
    text = read(path)
    old = f"{{ type: 'section', heading: '{heading}' }}"
    new = f"{{ id: '{block_id}', type: 'section', heading: '{heading}' }}"
    if new in text:
        return
    if old in text:
        write(path, text.replace(old, new, 1))
        return
    add_object_id(path, f"heading: '{heading}'", block_id)
'''

if old_object_function not in source:
    raise SystemExit('Original object helper has changed unexpectedly')
if old_section_function not in source:
    raise SystemExit('Original section helper has changed unexpectedly')

source = source.replace(old_object_function, new_object_function)
source = source.replace(old_section_function, new_section_function)
source = source.replace('add_inline_section_id(path, heading, block_id)', 'add_section_id(path, heading, block_id)')
exec(compile(source, str(source_path), 'exec'))
