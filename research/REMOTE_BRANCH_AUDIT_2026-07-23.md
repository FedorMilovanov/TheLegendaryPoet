# Аудит удалённых веток и план консолидации

Дата актуализации: 2026-07-23

Статус: `AUDIO-HARDENING-MERGED / RESEARCH-BRANCH-CONFLICTED / VALIDATION-IN-PROGRESS / DO-NOT-BULK-MERGE`

Цель этого файла — исключить параллельные источники истины. Крупные ветки не сливаются целиком только потому, что в них есть полезные файлы: сначала извлекаются уникальные слои, затем всё проверяется на актуальном `main`.

## Текущее состояние `main`

Проверенная вершина `main`: `43c65411a3fd695e65861f4939b891b5499c1d26` — **Harden the global audio runtime and repair integration regressions**.

В `main` находятся:

- рейтинги, Supabase/RPC и маршруты `/ratings`;
- музыкальный архив и release routes `/music/:slug`;
- MP3/WebP, manifest, waveform, права и SHA-256;
- постоянный `AudioPlayerProvider` над Router;
- `GlobalMiniPlayer` и `ImmersivePlayer` в `AudioChromeBoundary` вне route error boundary;
- версионированное хранилище аудиосессии, миграции и sanitization;
- retry, pending seek, race protection, ended replay и cross-tab coordination;
- Media Session и обязательный `validate:audio-session`.

PR #37 расходится с `main`: он впереди на сотни исследовательских/статьяных коммитов и отстаёт на шесть main-коммитов. Это не основание копировать аудиокод вручную или force-push’ить одну сторону. Нужна обычная интеграция с ручным разрешением общих файлов.

## Карта активных и закрытых веток

| PR | Ветка | Роль | Решение |
|---:|---|---|---|
| #32 | `archive-collage-real-photos` | воспроизводимый архивный коллаж | Сохранить отдельно до provenance repair. Не сливать derivatives/thumbnails как originals. |
| #34 | `work/yesenin-visual-series` | черновая часть I Есенина | Извлечь содержание вручную после факт-чека и локализации. Не merge целиком. |
| #37 | `work/local-images-playwright-wtoc` | основной article/research контур | Главная ветка консолидации исследований. Draft; интегрировать с актуальным `main` только по matrix ниже. |
| #38 | `audit/playwright-total-article-check` | ранний альтернативный аудит | Закрыт без merge как superseded. Reduced-motion перенесён; stable block IDs вынесены в issue #46. |
| #44 | `validation/research-source-gates-20260723` | наблюдаемый CI поверх #37 | Временный PR. Не сливать marker; закрыть после записи результатов. |
| #39–#45 | merged audio/community chain | канонический аудио- и rating-слой | Использовать только текущий `main`; не cherry-pick’ать повторно. |

## Каноническая граница аудио

Исследовательская интеграция не должна:

- перемещать или перекодировать MP3/WebP;
- менять waveform, release metadata, права или контрольные суммы;
- возвращать старый независимый `FeaturedTrackPlayer` вместо persistent provider;
- монтировать второй audio provider внутри маршрутов;
- помещать `GlobalMiniPlayer`/`ImmersivePlayer` внутрь route `ErrorBoundary`;
- удалять `RatingsPage`, `TrackDetailPage`, Supabase/RPC или storage migrations;
- терять `validate:audio-session` из `package.json` и CI.

## Конфликтные файлы: стратегия разрешения

| Файл/слой | Каноническая основа | Что сохранить с другой стороны |
|---|---|---|
| `src/App.tsx` | audio shell из актуального `main`: `AudioPlayerProvider`, `AudioChromeBoundary`, mini/immersive chrome | persistent navigation, lazy route modules, route error handling и article routes из #37; provider не должен перемонтироваться |
| `src/components/Header.tsx` | accessibility/prefetch/hit targets из #37 | актуальные ratings/music destinations из `main` |
| `src/components/MobileDock.tsx` | актуальный destination set и audio-safe layout из `main` | accessibility и persistent shell behavior из #37 |
| `src/components/command/commandItems.ts` | deferred search-index contract из #37 | ratings и все release pages из `main` |
| `src/pages/MusicPage.tsx` и release pages | только актуальный `main` | lazy route facade и SEO/schema compatibility из #37 без возврата старого плеера |
| `scripts/gen-sitemap.mjs` | объединённый генератор | все essays/poets/articles из #37 плюс ratings/releases из `main` |
| `scripts/prerender-og.mjs` | общий prerender #37 | music releases/ratings и MusicRecording metadata из `main` |
| `package.json` | объединение, не выбор одной версии | все research validators #37 плюс `validate:audio`, `validate:audio-session` и актуальные dependencies из `main` |
| `.github/workflows/ci.yml` | последовательность research/Playwright/build gates #37 | audio asset/session validators из `main`; diagnostics не должны маскировать финальный failure |
| `src/types/*` | совместимое объединение | article/media/source contracts #37 и audio/rating contracts `main` |
| community/audio hooks | только `main` | лишь импорты/маршрутизация, необходимые persistent shell |
| бинарные файлы | только `main` | никаких ручных пересохранений при конфликте |

## Уникальные слои других PR

### PR #34

Нужны только каркас части I Есенина 1895–1921 и series navigation. Уже установлены обязательные поправки: полное название Спас-Клепиковской школы; военно-санитарный поезд № 143; отсутствие надёжного подтверждения лазарета № 17; отказ от выдуманного единственного мотива ухода от Изрядновой. Remote media не переносится без license ledger и manifest.

### PR #38

Консолидация закончена. Reduced-motion проверка адаптирована в #37. Второй renderer, старый `LongformPage`, отдельный workflow и устаревшие source wrappers отклонены. Stable block IDs оформлены как issue #46; PR закрыт без merge.

### PR #32

Workflow и SHA технически воспроизводимы, но итог не готов к публикации: 28 derivatives через weserv, два thumbnails, пустые license URLs, повреждённые авторские строки и фактически пустой audit log. Переносить можно только после прямого скачивания originals, двойных SHA original/derivative, нормализации metadata и риск-аудита атрибуций.

## Текущая техническая верификация #37

Предыдущий validation run подтвердил зелёные source policy, 40+ unique URLs, inline citations, correspondence, Yesenin archive, responsive media, literary style, TypeScript и production build. Он выявил реальные остатки:

- 12 Playwright failures вокруг точного восстановления scroll position, модалей, reduced motion, runtime SEO и Lenis-aware navigation;
- Vite 7 manifest mismatch: валидатор ошибочно требовал `src/main.tsx`, хотя HTML-entry записан как `index.html`.

После run внесены:

- ref-counted Lenis pause/resume и повторное restoration после `resize()`;
- дополнительные fixes Reveal/Tilt/hash/modal tests;
- Vite 7-compatible shell detection в `validate-route-chunks`;
- сохранение citation diagnostics с финальным enforce, чтобы ранняя ошибка не скрывала build/Playwright/prerender.

Зелёный статус текущего head объявляется только после полного дочернего run #44.

## Порядок действий

1. Завершить validation PR #44 и сохранить точные logs/artifacts.
2. Исправить только фактически воспроизводимые citation/Playwright/build regressions; не ослаблять тесты ради зелёного статуса.
3. Закрыть #44 без merge marker-файла.
4. Интегрировать шесть актуальных main-коммитов в #37 вручную по matrix.
5. Прогнать `validate:audio`, `validate:audio-session`, source/citation/media/style/TypeScript, полный Playwright, build, route chunks, prerender и sitemap stability.
6. Только после этого переводить #37 из draft в ready for review.
7. Отдельно продолжать PDF/архивную работу; отсутствие источника не заменять предположением.

## Условия закрытия

- #34 закрывается после появления проверенной части I Есенина в основном article engine.
- #32 закрывается после provenance repair либо документированного отказа.
- #44 закрывается после зафиксированного validation evidence и никогда не merge’ится.
- #37 готов к review только после интеграции актуального `main`, полного зелёного CI и финальной редакционной вычитки публичных claims.
