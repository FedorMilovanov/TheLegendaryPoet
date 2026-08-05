from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]


def read(relative: str) -> str:
    return (ROOT / relative).read_text(encoding="utf-8")


def write(relative: str, content: str) -> None:
    (ROOT / relative).write_text(content, encoding="utf-8")


# Compact, ordered citation clusters must stay attached to the preceding sentence.
write(
    "src/components/essay/InlineCitations.tsx",
    """import type { EssaySource } from '../../types/essay';

export interface EssaySourceReference {
  number: number;
  source: EssaySource;
}

export type EssaySourceReferenceMap = Record<string, EssaySourceReference>;

export default function InlineCitations({
  sourceIds,
  references,
}: {
  sourceIds?: string[];
  references?: EssaySourceReferenceMap;
}) {
  if (!sourceIds?.length || !references) return null;

  const resolved = sourceIds
    .map((id) => ({ id, reference: references[id] }))
    .filter((item): item is { id: string; reference: EssaySourceReference } => Boolean(item.reference))
    .sort((a, b) => a.reference.number - b.reference.number);

  if (resolved.length === 0) return null;

  return (
    <sup className=\"ml-1 inline-flex whitespace-nowrap translate-y-[-0.12em] items-center gap-1 align-baseline not-italic\">
      {resolved.map(({ id, reference }) => (
        <a
          key={id}
          href={`#source-${id}`}
          title={reference.source.title}
          aria-label={`Источник ${reference.number}: ${reference.source.title}`}
          className=\"group/citation relative inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-luxury-gold/18 bg-luxury-gold/[0.055] px-1.5 font-sans text-[9px] font-bold leading-none tabular-nums text-luxury-gold/70 transition-[transform,border-color,background-color,color] duration-200 hover:-translate-y-0.5 hover:border-luxury-gold/40 hover:bg-luxury-gold/[0.11] hover:text-luxury-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-luxury-gold/65\"
        >
          {reference.number}
          <span
            role=\"tooltip\"
            className=\"pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-1/2 z-30 w-max max-w-64 -translate-x-1/2 whitespace-normal rounded-lg border border-luxury-gold/20 bg-[#12100c] px-2.5 py-1.5 text-left text-[10px] font-normal leading-snug normal-case tracking-normal text-luxury-gray-light/85 opacity-0 shadow-xl transition-opacity duration-150 group-hover/citation:opacity-100 group-focus-visible/citation:opacity-100\"
          >
            {reference.source.title}
          </span>
        </a>
      ))}
    </sup>
  );
}
""",
)

renderer = read("src/components/essay/ArticleRenderer.tsx")
renderer = renderer.replace(
    '<div className="essay-body flow-root">',
    '<div className="essay-body flow-root" lang="ru">',
)
write("src/components/essay/ArticleRenderer.tsx", renderer)

# Preserve the stronger live-tracking implementation from Arena 019fcf77.
tilt = read("src/components/TiltCard.tsx")
if "data-tilt-tracking" not in tilt:
    raise SystemExit("TiltCard lost the verified live-tracking contract")

hover_path = "src/hover-stability.css"
hover = read(hover_path)
hover = hover.replace(
    "transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);",
    "transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);",
)
if "transform-style: flat;" not in hover:
    raise SystemExit("Hover CSS lost the verified flat content-plane repair")
write(hover_path, hover)

for relative in ["qa/hover-stability.spec.mjs", "scripts/validate-hover-stability.ts"]:
    source = read(relative).replace("data-tilt-active", "data-tilt-tracking")
    write(relative, source)

qa_path = "qa/hover-stability.spec.mjs"
qa = read(qa_path)
marker = "for (const surface of surfaces) {"
title_test = r'''
test('article title remains painted throughout live 3D pointer tracking', async ({ page }) => {
  await page.goto(`${BASE_URL}/articles`, { waitUntil: 'domcontentloaded' });
  const card = page.locator('.tilt-card-inner').first();
  const title = card.locator('h3').first();
  await expect(card).toBeVisible();
  await expect(title).toBeVisible();
  await card.scrollIntoViewIfNeeded();
  const expectedText = await title.textContent();
  const box = await card.boundingBox();
  expect(box).not.toBeNull();
  if (!box) return;

  for (const [x, y] of [[0.16, 0.2], [0.5, 0.5], [0.84, 0.78]]) {
    await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps: 6 });
    await expect(card).toHaveAttribute('data-tilt-tracking', 'true');
    await expect(title).toHaveText(expectedText ?? '');
    const state = await title.evaluate((node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return {
        connected: node.isConnected,
        opacity: Number(style.opacity),
        visibility: style.visibility,
        display: style.display,
        width: rect.width,
        height: rect.height,
      };
    });
    expect(state.connected).toBe(true);
    expect(state.opacity).toBeGreaterThan(0.95);
    expect(state.visibility).not.toBe('hidden');
    expect(state.display).not.toBe('none');
    expect(state.width).toBeGreaterThan(1);
    expect(state.height).toBeGreaterThan(1);
  }
});

'''
if "article title remains painted throughout live 3D pointer tracking" not in qa:
    if marker not in qa:
        raise SystemExit("QA insertion marker not found")
    qa = qa.replace(marker, title_test + marker, 1)
write(qa_path, qa)

# Publication metadata reflects the verified editorial repair wave.
index_path = "src/data/essays/index.ts"
index = read(index_path)
index = re.sub(
    r"(const yeseninPartOnePublished: Essay = \{.*?dateModified: )'[^']+'",
    r"\1'2026-08-05'",
    index,
    count=1,
    flags=re.S,
)
index = re.sub(
    r"(const yeseninDuncanPublished: Essay = \{.*?dateModified: )'[^']+'",
    r"\1'2026-08-05'",
    index,
    count=1,
    flags=re.S,
)
write(index_path, index)

# Remove internal acquisition language from the reader-facing narrative while
# retaining the source and rights evidence in metadata and audit documents.
part_one_path = "src/data/essays/yeseninPartOnePublic.ts"
part_one = read(part_one_path)
replacements = {
    "Основной титул виден на третьем PDF-кадре; весь объект упакован в 35 кадров, включая предтитул, титул, оба раздела, оглавление и издательскую рекламу.":
        "Титульный лист и состав экземпляра просмотрены постранично: предтитул, титул, оба раздела, оглавление и издательская реклама.",
    "Для файлов зафиксированы точные URL, размеры и SHA-256. Их предел столь же важен, как содержание: осмотрены цифровые страницы ФЭБ, но не каждый контролирующий лист полного дела РГИА.":
        "Опубликованные страницы позволяют сверить документы с редакционной транскрипцией. При этом осмотрены цифровые страницы ФЭБ, но не каждый контролирующий лист полного дела РГИА.",
    "Цифровой экземпляр НЭБ теперь получен и просмотрен покадрово: 16 PDF-кадров показывают печатную обложку, внутренний титул, «Хулигана», «Сорокоуст» с посвящением А. Мариенгофу и датой «Август 1920», затем «Исповедь хулигана» с датой «Ноябрь 1920». SHA-256 исходного PDF зафиксирован. Это закрывает прежний вопрос о составе книги, но не превращает открытый библиотечный скан в автоматически разрешённое для публикации изображение.":
        "Цифровой экземпляр НЭБ просмотрен постранично: печатная обложка, внутренний титул, «Хулиган», «Сорокоуст» с посвящением А. Мариенгофу и датой «Август 1920», затем «Исповедь хулигана» с датой «Ноябрь 1920». Это уточняет состав книги и порядок вошедших в неё текстов.",
}
for old, new in replacements.items():
    part_one = part_one.replace(old, new)
write(part_one_path, part_one)

# Hard assertions: the live registry is singular and the reader-facing prose no
# longer leaks untranslated acquisition terminology.
if (ROOT / "src/routes/routeModules.tsx").exists():
    raise SystemExit("Stale routeModules.tsx still shadows the live registry")
app_validator = read("scripts/validate-app-shell.ts")
if "src/routes/routeModules.ts'" not in app_validator or "routeModules.tsx must not shadow" not in app_validator:
    raise SystemExit("App-shell validator is not checking the live route registry")
if "item-level" in part_one or "finding aid" in part_one:
    raise SystemExit("Reader-facing Yesenin Part I still contains untranslated archive workflow terms")

print("Marathon integration patch completed with route, prose, citation and hover assertions.")
