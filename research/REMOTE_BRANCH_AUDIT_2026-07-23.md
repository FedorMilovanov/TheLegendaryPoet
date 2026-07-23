# Аудит удалённых веток и план консолидации

Дата актуализации: 2026-07-23

Статус: `MUSIC-CATALOG-AND-ARCHIVE-MERGED / RESEARCH-BRANCH-CONFLICTED / VALIDATION-IN-PROGRESS / DO-NOT-BULK-MERGE`

Цель этого файла — исключить параллельные источники истины. Крупные ветки не сливаются целиком только потому, что в них есть полезные файлы: сначала извлекаются уникальные слои, затем всё проверяется на актуальном `main`.

## Текущее состояние `main`

Текущая подтверждённая merged-вершина `main`: `c495577144ddd057d424a16f7897534ae37f3d15` — **Harden the personal archive and unify listening history** (PR #50), поверх PR #47.

В `main` находятся:

- рейтинги, Supabase/RPC и маршрут `/ratings`;
- музыкальный архив и release routes `/music/:slug`;
- MP3/WebP, manifest, waveform, права и SHA-256;
- постоянный `AudioPlayerProvider`, audio chrome, Media Session и cross-tab coordination;
- lifecycle `published / coming-soon / archived`, `releaseOrder`, public/all registries, URL-state, safe queue и `validate:music-runtime`;
- personal archive v3: saved poems + listening sessions;
- безопасная migration legacy storage, corrupt/quota recovery, reconciliation, defensive copies и same-tab/cross-tab sync;
- `validate:audio-session` и `validate:archive-store`.

PR #37 впереди на сотни исследовательских/статьяных коммитов, но не содержит актуальный audio/music/archive runtime. Это не основание копировать код вручную или force-push’ить одну сторону. Нужна обычная интеграция с ручным разрешением общих файлов.

## Карта активных и закрытых веток

| PR | Ветка | Роль | Решение |
|---:|---|---|---|
| #32 | `archive-collage-real-photos` | воспроизводимый архивный коллаж | Сохранить отдельно до provenance repair. Не сливать derivatives/thumbnails как originals. |
| #34 | `work/yesenin-visual-series` | черновая часть I Есенина | Извлечь содержание вручную после факт-чека и локализации. Не merge целиком. |
| #37 | `work/local-images-playwright-wtoc` | основной article/research контур | Главная ветка консолидации исследований. Draft; интегрировать с актуальным `main` только по matrix ниже. |
| #38 | `audit/playwright-total-article-check` | ранний альтернативный аудит | Закрыт без merge как superseded. Reduced-motion перенесён; stable block IDs вынесены в issue #46. |
| #44 | `validation/research-source-gates-20260723` | наблюдаемый CI поверх #37 | Временный PR. Не сливать marker; закрыть после записи результатов. |
| #47 | `feat/music-catalog-scale-hardening` | lifecycle и масштабирование музыкального каталога | Слит. Использовать только текущий `main`; не cherry-pick’ать повторно. |
| #50 | `feat/personal-archive-hardening` | personal archive v3 и listening history | Слит. Использовать только текущий `main`; сохранять migrations/recovery/cross-tab и `validate:archive-store`. |

## Каноническая граница audio/music/archive

Исследовательская интеграция не должна:

- перемещать или перекодировать MP3/WebP;
- менять waveform, release metadata, права или контрольные суммы;
- возвращать старый независимый player или монтировать второй audio provider;
- помещать audio chrome внутрь route `ErrorBoundary`;
- удалять ratings, release routes, community schema, lifecycle каталога или storage migrations;
- публиковать ложные audio metadata для coming-soon записей;
- терять personal archive v3, migration/recovery/reconciliation или cross-tab sync;
- терять `validate:audio-session`, `validate:music-runtime` или `validate:archive-store`;
- повторно cherry-pick’ать merged PR #39–#45, #47 или #50.

## Конфликтные файлы: стратегия разрешения

| Файл/слой | Каноническая основа | Что сохранить с другой стороны |
|---|---|---|
| `src/App.tsx` | audio shell из актуального `main`: provider, audio chrome, ratings/releases/archive destinations | persistent navigation, lazy route modules, route error handling и article routes из #37 |
| `src/components/Header.tsx` | accessibility/prefetch/hit targets из #37 | актуальные ratings/music/archive destinations из `main` |
| `src/components/MobileDock.tsx` | актуальный destination set и audio-safe layout из `main` | accessibility и persistent shell behavior из #37 |
| `src/components/command/commandItems.ts` | deferred search-index contract из #37 | ratings, все release pages и personal archive из `main` |
| `src/pages/MusicPage.tsx`, release pages | только актуальный `main` | lazy route facade и SEO/schema compatibility из #37 |
| `src/pages/MyArchivePage.tsx`, archive store/hooks | только актуальный `main@c495577…` | lazy route/prefetch contract #37 без потери migrations/recovery/cross-tab |
| `src/components/poet-detail/PoemCard.tsx` | archive subscription/ARIA behavior из `main` | визуальные и renderer-контракты #37 |
| `scripts/gen-sitemap.mjs` | объединённый генератор | essays/poets/articles #37 плюс ratings и stable release routes `main` |
| `scripts/prerender-og.mjs` | общий prerender #37 | published/coming-soon/archived semantics `main` |
| `package.json` | объединение, не выбор одной версии | research validators #37 плюс audio/music/runtime/session/archive validators `main` |
| `.github/workflows/ci.yml` | research/Playwright/build gates #37 | physical audio, music runtime, session и archive-store validators `main` |
| `src/types/*` | совместимое объединение | article/media/source-alias contracts #37 и audio/rating/catalog/archive contracts `main` |
| бинарные файлы | только `main` | никаких ручных пересохранений |

## Уникальные слои других PR

### PR #34

Нужны только каркас части I Есенина 1895–1921 и series navigation. Обязательные поправки: полное название Спас-Клепиковской школы; поезд № 143; отсутствие надёжного подтверждения лазарета № 17; отказ от выдуманного единственного мотива ухода от Изрядновой. Remote media не переносится без license ledger и manifest.

### PR #38

Консолидация закончена. Reduced-motion проверка адаптирована в #37. Второй renderer, старый `LongformPage`, отдельный workflow и устаревшие source wrappers отклонены. Stable block IDs оформлены как issue #46; PR закрыт без merge.

### PR #32

Workflow и SHA технически воспроизводимы, но итог не готов к публикации: 28 derivatives через weserv, два thumbnails, пустые license URLs, повреждённые author strings и пустой audit log. Переносить можно только после direct originals, двойных SHA, нормализации metadata и риск-аудита атрибуций.

## Текущая техническая верификация #37

Диагностические прогоны последовательно выявили и исправили:

- Vite 7 manifest mismatch `src/main.tsx` против реального HTML-entry `index.html`;
- ранние Playwright-регрессии модалей, reduced motion, runtime SEO, tilt, hash и Lenis;
- orphaned inline citations из-за параллельных source IDs при URL-deduplication;
- неверное сравнение двух независимых mobile lightbox sessions с одной координатой;
- deep TOC-anchor, который начинал движение, но мог остановиться до цели после dynamic layout.

Текущая реализация:

- одна source card на URL при сохранении старых/новых IDs как строго валидируемых aliases;
- все aliases ведут в один numbered bibliography row и canonical hash;
- article blocks видимы до hydration при reduced motion через CSS fail-safe;
- ref-counted Lenis pause/resume восстанавливает exact modal position;
- deep anchor повторно измеряет layout и доводит позицию только если smooth scroll не сел на 96px;
- citation и Playwright diagnostics сохраняются, но final enforce gates остаются строгими.

Validation PR #44 должен проверять точную финальную вершину #37 после этого обновления. Зелёный статус объявляется только по полному exact-head run.

## Порядок действий

1. Запустить exact-head validation PR #44 после последнего REMOTE-обновления.
2. Сохранить точные logs/artifacts; исправлять только воспроизводимые остатки.
3. Закрыть #44 без merge marker-файла.
4. Интегрировать актуальный `main@c495577…` в #37 вручную по issue #48.
5. Прогнать research gates, `validate:audio`, `validate:music-runtime`, `validate:audio-session`, `validate:archive-store`, полный Playwright, build, route chunks, prerender и sitemap stability.
6. Только после этого переводить #37 из draft в ready for review.
7. Продолжать PDF/архивную работу по issue #49; отсутствие источника не заменять предположением.

## Условия закрытия

- #34 закрывается после появления проверенной части I Есенина в основном article engine.
- #32 закрывается после provenance repair либо документированного отказа.
- #44 закрывается после зафиксированного validation evidence и никогда не merge’ится.
- #37 готов к review только после интеграции актуального `main`, полного зелёного CI и финальной редакционной вычитки публичных claims.
