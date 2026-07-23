# Полный инвентарь активных REMOTE-веток

Дата актуализации: 2026-07-23

Статус: `ACTIVE-BRANCHES-CLASSIFIED / AUDIO-HARDENING-MERGED / NO-BULK-DELETIONS`

Этот файл фиксирует ветки, которым соответствует незакрытый PR, а также закрытые ветки, ещё важные для истории консолидации. Ветки merged-PR не являются альтернативными источниками истины: их содержимое берётся только из актуального `main`.

## Актуальный `main`

Текущая проверенная вершина `main`: `43c65411a3fd695e65861f4939b891b5499c1d26` — **Harden the global audio runtime and repair integration regressions**.

После слияния PR #45 канонический аудиослой включает:

- постоянный `AudioPlayerProvider` над Router;
- `GlobalMiniPlayer` и `ImmersivePlayer` через отдельный `AudioChromeBoundary`;
- версионированное хранилище аудиосессии и миграции;
- retry, pending seek, восстановление после ошибок и защиту от гонок смены трека;
- BroadcastChannel/storage fallback и Media Session;
- обязательный валидатор `validate:audio-session`.

Исследовательская ветка #37 расходится с `main`: она существенно впереди по статьям и research-корпусу, но отстаёт на шесть main-коммитов аудио/рейтингов. При интеграции аудиореализация берётся из `main`, а не реконструируется по старым PR.

## Открытые PR и ветки

| PR | Ветка | Роль | Решение |
|---:|---|---|---|
| #32 | `archive-collage-real-photos` | воспроизводимый коллаж Маяковского/Бриков из Commons | Не сливать. Artifact технически воспроизводим, но 28 файлов — перекодированные derivatives, два — thumbnails; отсутствуют license URLs, повреждены author strings и пуст audit log. Нужен provenance repair либо документированный отказ. |
| #34 | `work/yesenin-visual-series` | черновой каркас первой части биографии Есенина 1895–1921 | Не сливать целиком. Переносить текст вручную только после claim-ledger, PDF-проверки, 40+ classified sources и локализации медиа. |
| #37 | `work/local-images-playwright-wtoc` | основной research/article-engine PR | Главная исследовательская ветка. Draft и non-mergeable до ручной интеграции актуального `main`, полного CI и редакционной вычитки. Аудиобинарники/runtime не переписывать. |
| #44 | `validation/research-source-gates-20260723` | временная дочерняя CI-ветка #37 | Не сливать. Использовать только для наблюдаемого Actions-run; marker-файл не переносить. После фиксации доказательств закрыть PR и удалить ref. |

## Закрытая диагностическая ветка

| PR | Ветка | Статус |
|---:|---|---|
| #38 | `audit/playwright-total-article-check` | Закрыт без merge как superseded by #37. Reduced-motion проверка перенесена; миграция stable block IDs вынесена в issue #46. Старый renderer/workflow не возвращать. |

## Уже слитая аудиоцепочка

Следующие PR закрыты как merged и не должны cherry-pick’аться повторно:

| PR | Канонический слой в `main` |
|---:|---|
| #39 | рейтинги, музыкальный архив, release pages, MP3 manifest, Supabase/RPC |
| #40 | удаление временных metadata/JPEG-дублей |
| #41 | финальная раскладка Yesenin WebP в `public/images/music` |
| #42 | premium player polish и release pages |
| #43 | persistent global audio context, mini-player, immersion mode, waveform и Media Session |
| #45 | hardening аудиосессии: миграции, retry, race guards, cross-tab, accessibility и `validate:audio-session` |

Повторный перенос этих коммитов создаст дубли providers, маршрутов, storage migrations и Media Session handlers. Источник истины — текущий `main`.

## Исторические merged-ветки

PR #1–#31, #33, #35–#36 и #39–#45 представлены в истории `main`. Их refs могут быть удалены только после проверки branch protection и отсутствия зависимых открытых PR/Actions.

## Что можно удалить после завершения

- `validation/research-source-gates-20260723` — после закрытия #44;
- `audit/playwright-total-article-check` — PR #38 уже закрыт; ref удалить после завершения связанных Actions и проверки, что на него не ссылается automation;
- `work/yesenin-visual-series` — после переноса проверенной части I и закрытия #34;
- `archive-collage-real-photos` — после repair pass либо документированного отказа;
- merged audio feature branches — после проверки branch protection и отсутствия зависимых workflow.

## Что нельзя удалять сейчас

- `main`;
- `work/local-images-playwright-wtoc`;
- `validation/research-source-gates-20260723`, пока идёт validation run;
- ветки #32 и #34, пока их уникальные материалы не извлечены;
- любые refs, участвующие в текущем GitHub Actions run.

## Порядок безопасной уборки

1. Получить полный validation run #44 и записать фактические результаты.
2. Закрыть #44 без merge, затем удалить только его marker-ref.
3. Интегрировать актуальный `main` в #37 по ручной conflict matrix, сохранив аудио из PR #45.
4. Прогнать source/citation/media/TypeScript/Playwright/build/route chunks/prerender плюс `validate:audio` и `validate:audio-session`.
5. Перенести проверенную часть I Есенина; закрыть #34.
6. Решить судьбу #32 после provenance repair.
7. Удалять refs закрытых PR по одному, без массовой команды и без force-update `main`.
