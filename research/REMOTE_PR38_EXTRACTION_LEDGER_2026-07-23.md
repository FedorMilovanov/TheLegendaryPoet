# PR #38: extraction ledger

Дата: 2026-07-23

Источник: `audit/playwright-total-article-check`

Статус: `PARTIALLY-EXTRACTED / DO-NOT-MERGE-WHOLE-BRANCH`

## Итог

PR #38 был полезным диагностическим этапом, но большая часть его архитектуры уже превзойдена PR #37. Целиком ветка не сливается: это вернуло бы второй page shell, более старые данные статей и дублирующий workflow поверх текущего persistent shell, route chunks, media manifest, SEO/prerender и Chromium sweep.

## Таблица решений

| Файл/слой PR #38 | Решение | Причина |
|---|---|---|
| `tests/playwright-audit/reduced-motion.spec.ts` | **ПЕРЕНЕСЕНО И АДАПТИРОВАНО** | Уникальная полезная проверка: все блоки должны быть сразу читаемы при `prefers-reduced-motion`. В #37 добавлен `e2e/reduced-motion.spec.ts`, использующий текущую `.essay-body` и штатный Playwright config. |
| `tests/playwright-audit/article-system.spec.ts` | **НЕ ПЕРЕНОСИТЬ ЦЕЛИКОМ** | Большинство сценариев уже покрыто более поздними `essay-engine`, `media-stability`, `modal-stability`, `card-cover-stability`, `seo-runtime` и `topic-cluster` тестами #37. Возможные уникальные assertions проверяются точечно. |
| `scripts/validate-essay-block-ids.ts` | **ЦЕННАЯ ИДЕЯ, МИГРАЦИЯ ОТЛОЖЕНА** | В #38 citation/image enrichment привязан к стабильным block ids. В #37 изображения уже используют стабильный `mediaKey`, но часть citation rules пока сопоставляется по `startsWith`. Нельзя просто включить валидатор: текущий тип `EssayBlock` не содержит общего `id`, а все пять текстов потребуют явной миграции. Задача остаётся отдельным техническим этапом. |
| `src/data/essays/essayCitations.ts` из #38 | **НЕ ПЕРЕЗАПИСЫВАТЬ** | В #37 есть более свежие правила и источниковые массивы. Нужно заменить `startsWith` на block ids внутри текущего файла, а не возвращать старую версию. |
| `src/data/essays/yeseninSources.ts` | **СОДЕРЖАНИЕ УЖЕ ПОКРЫТО/УСИЛЕНО** | Новый `yeseninDocumentSources.ts` классифицирует FEB, ИМЛИ, НЭБ, протоколы, клинику, экспертизы и ограничения. Большинство URL совпадает; общая FEB-страница больше не ошибочно считается единичным первичным источником. |
| `src/components/essay/LongformPage.tsx` | **НЕ ПЕРЕНОСИТЬ** | Текущий shell и `ArticleRenderer` #37 уже объединяют essays/legacy articles и работают с persistent app shell. Второй page shell увеличит divergence и риск повторного монтирования глобальных listeners. |
| `src/components/essay/ArticleRenderer.tsx` | **НЕ ПЕРЕЗАПИСЫВАТЬ** | Текущая версия #37 содержит локальный media resolver, source references, stable image shell и float placement. Из #38 переносится только идея block ids отдельной миграцией. |
| `src/data/articles/legacyArticleAdapter.ts` | **СВЕРИТЬ, НО НЕ ПЕРЕНОСИТЬ АВТОМАТИЧЕСКИ** | В #37 legacy `Article` уже проходит общий renderer. Следует сравнить только обработку старого HTML/content и метаданных. |
| `scripts/validate-article-engine.ts` | **ПОКРЫТО** | Унификация проверяется текущим content/route/Playwright контуром; отдельный старый валидатор создаст дублирование. |
| `scripts/validate-citations.ts` | **ПОКРЫТО БОЛЕЕ НОВОЙ ВЕРСИЕЙ** | В #37 проверяются bibliography ids и inline source references; новый 40-link gate добавлен отдельно. |
| `.github/workflows/playwright-article-audit.yml` | **НЕ ПЕРЕНОСИТЬ** | Основной CI уже выполняет Chromium sweep, build и prerender. Отдельный workflow снова разделит источник истины и будет расходовать Actions дважды. |
| `playwright.audit.config.ts` | **НЕ ПЕРЕНОСИТЬ** | Текущий `playwright.config.ts` покрывает desktop Chrome и Pixel 7, хранит concise JSON/HTML/trace и использует единый test directory. |
| `docs/ARTICLE_ENGINE_AUDIT.md` | **АРХИВНЫЙ КОНТЕКСТ** | Полезен как описание ранней цели, но утверждение о block ids пока не полностью соответствует #37. Не переносить как действующую документацию до окончания миграции ids. |
| старые data wrappers/visual layouts | **НЕ ПЕРЕНОСИТЬ** | В #37 более новые local covers, media manifest, source libraries и SEO clusters. |

## Отдельная задача: стабильные block ids

### Проблема в текущем #37

- изображения уже привязаны к `mediaKey`;
- section anchors устойчивы;
- citation rules для Маяковского/Бриков всё ещё используют начало текста (`startsWith`);
- редакционная правка первой фразы может незаметно снять inline citations.

### Безопасный план миграции

1. Добавить общий optional `id` ко всем `EssayBlock`.
2. Выдать ids всем блокам, которые имеют `sourceIds`, участвуют в visual placement или являются целями редакционных вставок.
3. Изменить `attachEssayCitations` на карту `blockId -> sourceIds`.
4. Добавить валидатор уникальности и формата ids.
5. На один переходный цикл запрещать orphan citation rules и одновременно поддерживать старые `startsWith` только как warning fallback.
6. После миграции удалить текстовый matcher.
7. Проверить snapshots/Playwright для всех пяти лонгридов.

Эта миграция будет выполнена в #37 отдельной серией небольших коммитов, а не импортом старого renderer из #38.

## Условие закрытия PR #38

После завершения block-id migration или явного создания follow-up issue PR #38 можно закрыть как `superseded by #37`. Уникальная reduced-motion проверка уже сохранена.
