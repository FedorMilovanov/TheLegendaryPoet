# Аудит удалённых веток и план консолидации

Дата актуализации: 2026-07-23

Статус: `MUSIC-CATALOG-SCALE-MERGED / ARCHIVE-AGENT-ACTIVE / RESEARCH-BRANCH-CONFLICTED / VALIDATION-IN-PROGRESS / DO-NOT-BULK-MERGE`

Цель этого файла — исключить параллельные источники истины. Крупные ветки не сливаются целиком только потому, что в них есть полезные файлы: сначала извлекаются уникальные слои, затем всё проверяется на актуальном `main`.

## Текущее состояние `main`

Последняя подтверждённая merged-вершина `main`: `9ae52e5fd56644b425171c13506b0da855a60b04` — **Scale and harden the music catalog for future releases** (PR #47).

В `main` находятся:

- рейтинги, Supabase/RPC и маршрут `/ratings`;
- музыкальный архив и release routes `/music/:slug`;
- MP3/WebP, manifest, waveform, права и SHA-256;
- постоянный `AudioPlayerProvider` над Router;
- `GlobalMiniPlayer` и `ImmersivePlayer` в `AudioChromeBoundary` вне route error boundary;
- версионированное хранилище аудиосессии, миграции и sanitization;
- retry, pending seek, race protection, ended replay и cross-tab coordination;
- Media Session и `validate:audio-session`;
- lifecycle `published / coming-soon / archived`, уникальный `releaseOrder`, public/all registries;
- поиск и фильтры с URL-state, порционная отрисовка, safe playback queue и recommendations;
- physical audio/artwork validation, `validate:music-runtime` и release workflow.

PR #50 `feat/personal-archive-hardening` активен у другого агента. Он меняет `MyArchivePage`, saved-poem/session store, `PoemCard`, новый listening item, `package.json`, validator и документацию. Эту ветку нельзя частично переносить или редактировать из #37; после её завершения итог берётся из нового `main`.

PR #37 впереди на сотни исследовательских/статьяных коммитов, но не содержит актуальный audio/music/archive runtime. Это не основание копировать код вручную или force-push’ить одну сторону. Нужна обычная интеграция с ручным разрешением общих файлов после завершения активных runtime-веток.

## Карта активных и закрытых веток

| PR | Ветка | Роль | Решение |
|---:|---|---|---|
| #32 | `archive-collage-real-photos` | воспроизводимый архивный коллаж | Сохранить отдельно до provenance repair. Не сливать derivatives/thumbnails как originals. |
| #34 | `work/yesenin-visual-series` | черновая часть I Есенина | Извлечь содержание вручную после факт-чека и локализации. Не merge целиком. |
| #37 | `work/local-images-playwright-wtoc` | основной article/research контур | Главная ветка консолидации исследований. Draft; интегрировать с актуальным `main` только по matrix ниже. |
| #38 | `audit/playwright-total-article-check` | ранний альтернативный аудит | Закрыт без merge как superseded. Reduced-motion перенесён; stable block IDs вынесены в issue #46. |
| #44 | `validation/research-source-gates-20260723` | наблюдаемый CI поверх #37 | Временный PR. Не сливать marker; закрыть после записи результатов. |
| #47 | `feat/music-catalog-scale-hardening` | lifecycle и масштабирование музыкального каталога | Слит. Использовать только текущий `main`; не cherry-pick’ать повторно. |
| #50 | `feat/personal-archive-hardening` | активная работа другого агента над saved poems/listening history | Не вмешиваться. После завершения учитывать итоговые migrations, cross-tab sync и `validate:archive-store`. |

## Каноническая граница audio/music/archive

Исследовательская интеграция не должна:

- перемещать или перекодировать MP3/WebP;
- менять waveform, release metadata, права или контрольные суммы;
- возвращать старый независимый `FeaturedTrackPlayer` вместо persistent provider;
- монтировать второй audio provider внутри маршрутов;
- помещать `GlobalMiniPlayer`/`ImmersivePlayer` внутрь route `ErrorBoundary`;
- удалять `RatingsPage`, `TrackDetailPage`, Supabase/RPC или storage migrations;
- терять lifecycle `published / coming-soon / archived`, `releaseOrder`, public/all registries или safe queue;
- публиковать ложные audio metadata для coming-soon записей;
- терять `validate:audio-session`, `validate:music-runtime` или итоговый `validate:archive-store`;
- частично переносить незавершённый PR #50.

## Конфликтные файлы: стратегия разрешения

| Файл/слой | Каноническая основа | Что сохранить с другой стороны |
|---|---|---|
| `src/App.tsx` | audio shell из актуального `main`: provider, audio chrome, ratings/releases/archive destinations | persistent navigation, lazy route modules, route error handling и article routes из #37; provider не должен перемонтироваться |
| `src/components/Header.tsx` | accessibility/prefetch/hit targets из #37 | актуальные ratings/music/archive destinations из `main` |
| `src/components/MobileDock.tsx` | актуальный destination set и audio-safe layout из `main` | accessibility и persistent shell behavior из #37 |
| `src/components/command/commandItems.ts` | deferred search-index contract из #37 | ratings, все release pages и итоговый archive navigation из `main` |
| `src/pages/MusicPage.tsx`, release pages | только актуальный `main` | lazy route facade и SEO/schema compatibility из #37 без возврата старого плеера |
| `src/pages/MyArchivePage.tsx`, archive store/hooks | итог PR #50 после merge | lazy route/prefetch contract #37, без потери migrations/recovery/cross-tab |
| `scripts/gen-sitemap.mjs` | объединённый генератор | essays/poets/articles #37 плюс ratings и все stable release routes из `main` |
| `scripts/prerender-og.mjs` | общий prerender #37 | published/coming-soon/archived release semantics из `main` |
| `package.json` | объединение, не выбор одной версии | research validators #37 плюс audio/music/runtime/session/archive validators `main` |
| `.github/workflows/ci.yml` | последовательность research/Playwright/build gates #37 | physical audio, music runtime, session и archive-store validators `main`; diagnostics не маскируют final failure |
| `src/types/*` | совместимое объединение | article/media/source-alias contracts #37 и audio/rating/catalog/archive contracts `main` |
| community/audio/archive hooks | только `main` | лишь импорты/маршрутизация, необходимые persistent shell |
| бинарные файлы | только `main` | никаких ручных пересохранений при конфликте |

## Уникальные слои других PR

### PR #34

Нужны только каркас части I Есенина 1895–1921 и series navigation. Уже установлены обязательные поправки: полное название Спас-Клепиковской школы; военно-санитарный поезд № 143; отсутствие надёжного подтверждения лазарета № 17; отказ от выдуманного единственного мотива ухода от Изрядновой. Remote media не переносится без license ledger и manifest.

### PR #38

Консолидация закончена. Reduced-motion проверка адаптирована в #37. Второй renderer, старый `LongformPage`, отдельный workflow и устаревшие source wrappers отклонены. Stable block IDs оформлены как issue #46; PR закрыт без merge.

### PR #32

Workflow и SHA технически воспроизводимы, но итог не готов к публикации: 28 derivatives через weserv, два thumbnails, пустые license URLs, повреждённые авторские строки и пустой audit log. Переносить можно только после прямого скачивания originals, двойных SHA original/derivative, нормализации metadata и риск-аудита атрибуций.

## Текущая техническая верификация #37

Диагностические прогоны последовательно выявили и исправили:

- Vite 7 manifest mismatch `src/main.tsx` против реального HTML-entry `index.html`;
- 12 ранних Playwright-регрессий модалей, reduced motion, runtime SEO, tilt, hash и Lenis;
- orphaned inline citations из-за параллельных source IDs при URL-deduplication;
- неверное сравнение двух независимых mobile lightbox sessions с одной координатой;
- глубокий TOC-anchor, который начинал движение, но мог остановиться до цели после динамического расширения longread.

Текущая реализация:

- дедуплицирует одну source card на URL, но сохраняет старые/новые IDs как строго валидируемые aliases;
- направляет все aliases в один numbered bibliography row и canonical hash;
- делает article blocks видимыми до hydration при `prefers-reduced-motion` через CSS fail-safe;
- ref-counted Lenis pause/resume восстанавливает exact modal position;
- deep anchor повторно измеряет layout и немедленно доводит позицию только если smooth scroll не сел на 96px;
- citation и Playwright diagnostics сохраняются, но финальные enforce gates остаются строгими.

Validation run #758 уже прошёл library, essay/source policy, 40+ URLs, canonical aliases, inline citations, clusters, correspondence, Yesenin archive, media/style и TypeScript. Полный Playwright и production tail ещё выполняются; зелёный статус текущего head объявляется только после полного дочернего run #44.

## Порядок действий

1. Завершить validation PR #44 и сохранить точные logs/artifacts.
2. Исправить только фактически воспроизводимые остатки; не ослаблять тесты ради зелёного статуса.
3. Проверить финальную вершину #37 после последних документационных коммитов отдельным observable run.
4. Закрыть #44 без merge marker-файла.
5. Дождаться результата PR #50; не вмешиваться в его implementation.
6. Интегрировать актуальный `main` в #37 вручную по issue #48.
7. Прогнать research gates, `validate:audio`, `validate:music-runtime`, `validate:audio-session`, `validate:archive-store`, полный Playwright, build, route chunks, prerender и sitemap stability.
8. Только после этого переводить #37 из draft в ready for review.
9. Отдельно продолжать PDF/архивную работу по issue #49; отсутствие источника не заменять предположением.

## Условия закрытия

- #34 закрывается после появления проверенной части I Есенина в основном article engine.
- #32 закрывается после provenance repair либо документированного отказа.
- #44 закрывается после зафиксированного validation evidence и никогда не merge’ится.
- #37 готов к review только после интеграции актуального `main`, полного зелёного CI и финальной редакционной вычитки публичных claims.
