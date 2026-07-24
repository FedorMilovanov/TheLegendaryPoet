# Полный инвентарь активных REMOTE-веток

Дата актуализации: 2026-07-23

Статус: `ACTIVE-BRANCHES-CLASSIFIED / MUSIC-CATALOG-AND-ARCHIVE-MERGED / NO-BULK-DELETIONS`

Этот файл фиксирует ветки, которым соответствует незакрытый PR, а также закрытые ветки, ещё важные для истории консолидации. Ветки merged-PR не являются альтернативными источниками истины: их содержимое берётся только из актуального `main`.

## Актуальный `main`

Текущая подтверждённая merged-вершина `main`: `c495577144ddd057d424a16f7897534ae37f3d15` — **Harden the personal archive and unify listening history** (PR #50), поверх PR #47.

Канонический audio/music/archive слой включает:

- постоянный `AudioPlayerProvider` над Router;
- `GlobalMiniPlayer` и `ImmersivePlayer` через отдельный `AudioChromeBoundary`;
- версионированное хранилище аудиосессии, retry, pending seek, race guards, cross-tab и Media Session;
- lifecycle `published / coming-soon / archived`, стабильный `releaseOrder`, public/all registries;
- поиск, фильтры, URL-state, порционную отрисовку и safe playback queue;
- physical asset validation, `validate:music-runtime` и release workflow;
- личный архив saved poems + listening sessions;
- storage key `tlp-my-archive:v3`, безопасную legacy migration, corrupt/quota recovery, reconciliation и defensive copies;
- same-tab/cross-tab sync через `useSyncExternalStore`;
- `validate:audio-session` и `validate:archive-store`.

Исследовательская ветка #37 существенно впереди по статьям и research-корпусу, но не содержит актуальный audio/music/archive хвост `main`. При интеграции эти реализации берутся из `main`, а не реконструируются по старым PR.

## Открытые PR и ветки

| PR | Ветка | Роль | Решение |
|---:|---|---|---|
| #32 | `archive-collage-real-photos` | воспроизводимый коллаж Маяковского/Бриков из Commons | Не сливать. Artifact технически воспроизводим, но 28 файлов — перекодированные derivatives, два — thumbnails; отсутствуют license URLs, повреждены author strings и пуст audit log. Нужен provenance repair либо документированный отказ. |
| #34 | `work/yesenin-visual-series` | черновой каркас первой части биографии Есенина 1895–1921 | Не сливать целиком. Переносить текст вручную только после claim-ledger, PDF-проверки, 40+ classified sources и локализации медиа. |
| #37 | `work/local-images-playwright-wtoc` | основной research/article-engine PR | Главная исследовательская ветка. Draft и non-mergeable до ручной интеграции актуального `main`, полного CI и редакционной вычитки. Audio/music/archive runtime не переписывать. |
| #44 | `validation/research-source-gates-20260723` | временная дочерняя CI-ветка #37 | Не сливать. Использовать только для наблюдаемого Actions-run; marker-файл не переносить. После фиксации доказательств закрыть PR и удалить ref. |

## Закрытые диагностические/merged ветки

| PR | Ветка | Статус |
|---:|---|---|
| #38 | `audit/playwright-total-article-check` | Закрыт без merge как superseded by #37. Reduced-motion проверка перенесена; stable block IDs вынесены в issue #46. |
| #47 | `feat/music-catalog-scale-hardening` | Слит. Lifecycle каталога, public/all registries, URL-state, safe queue, physical asset validation и `validate:music-runtime`. |
| #50 | `feat/personal-archive-hardening` | Слит. Saved-poem migrations, listening archive, recovery/cross-tab и `validate:archive-store`. |

## Уже слитая audio/music/archive-цепочка

Следующие PR не должны cherry-pick’аться повторно:

| PR | Канонический слой в `main` |
|---:|---|
| #39 | рейтинги, музыкальный архив, release pages, MP3 manifest, Supabase/RPC |
| #40 | удаление временных metadata/JPEG-дублей |
| #41 | финальная раскладка Yesenin WebP в `public/images/music` |
| #42 | premium player polish и release pages |
| #43 | persistent global audio context, mini-player, immersion mode, waveform и Media Session |
| #45 | hardening аудиосессии: migrations, retry, race guards, cross-tab, accessibility и `validate:audio-session` |
| #47 | масштабируемый lifecycle каталога, public/all registries, search/filter URL-state, safe queue, physical asset validation и `validate:music-runtime` |
| #50 | personal archive v3, migration/recovery/reconciliation, saved poems + listening sessions и `validate:archive-store` |

Повторный перенос создаст дубли providers, маршрутов, storage migrations, Media Session handlers, catalog/archive invariants. Источник истины — текущий `main`.

## Исторические merged-ветки

PR #1–#31, #33, #35–#36, #39–#45, #47 и #50 представлены в истории `main`. Их refs могут быть удалены только после проверки branch protection и отсутствия зависимых открытых PR/Actions.

## Что можно удалить после завершения

- `validation/research-source-gates-20260723` — после закрытия #44;
- `audit/playwright-total-article-check` — PR #38 уже закрыт; ref удалить после проверки зависимостей;
- `work/yesenin-visual-series` — после переноса проверенной части I и закрытия #34;
- `archive-collage-real-photos` — после repair pass либо документированного отказа;
- merged audio/music/archive feature branches — после проверки branch protection и отсутствия зависимых workflow.

## Что нельзя удалять сейчас

- `main`;
- `work/local-images-playwright-wtoc`;
- `validation/research-source-gates-20260723`, пока идёт validation run;
- ветки #32 и #34, пока их уникальные материалы не извлечены;
- любые refs, участвующие в текущем GitHub Actions run.

## Порядок безопасной уборки

1. Получить полный validation run #44 и записать фактические результаты.
2. Закрыть #44 без merge, затем удалить только его marker-ref.
3. Интегрировать актуальный `main@c495577…` в #37 по issue #48, сохранив PR #45, #47 и #50.
4. Прогнать source/citation/media/TypeScript/Playwright/build/route chunks/prerender плюс `validate:audio`, `validate:music-runtime`, `validate:audio-session` и `validate:archive-store`.
5. Перенести проверенную часть I Есенина; закрыть #34.
6. Решить судьбу #32 после provenance repair.
7. Удалять refs закрытых PR по одному, без массовой команды и без force-update `main`.
