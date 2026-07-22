from pathlib import Path

source_path = Path('scripts/migrate-essay-rules-to-block-ids.py')
source = source_path.read_text(encoding='utf-8')

old_function = '''def add_inline_section_id(path: str, heading: str, block_id: str) -> None:
    text = read(path)
    old = f"{{ type: 'section', heading: '{heading}' }}"
    new = f"{{ id: '{block_id}', type: 'section', heading: '{heading}' }}"
    if new in text:
        return
    if old not in text:
        raise SystemExit(f'{path}: inline section not found: {heading}')
    write(path, text.replace(old, new, 1))
'''

new_function = '''def add_section_id(path: str, heading: str, block_id: str) -> None:
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

if old_function not in source:
    raise SystemExit('Original migration helper has changed unexpectedly')

source = source.replace(old_function, new_function)
source = source.replace('add_inline_section_id(path, heading, block_id)', 'add_section_id(path, heading, block_id)')
exec(compile(source, str(source_path), 'exec'))
