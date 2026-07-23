# Полный инвентарь активных REMOTE-веток

Дата: 2026-07-23

Статус: `ACTIVE-BRANCHES-CLASSIFIED / NO-DELETIONS-PERFORMED`

Этот файл фиксирует все ветки, которым соответствует незакрытый PR. Ветки уже слитых PR не считаются альтернативными источниками истины: их содержимое живёт в `main`, а старые refs могут быть удалены позже отдельной уборкой после проверки branch protection.

## Открытые ветки

| PR | Ветка | Владелец работы | Роль | Действие |
|---:|---|---|---|---|
| #32 | `archive-collage-real-photos` | архивный visual experiment | воспроизводимый коллаж Маяковского/Бриков из Commons | Не сливать. Artifact проверен: 30 уникальных файлов и совпавшие SHA, но не настоящие Commons originals, пустые license URLs, повреждённые author strings и пустой audit log. Нужен repair pass. |
| #34 | `work/yesenin-visual-series` | контентная ветка Есенина | первая часть биографии 1895–1921 и series contract | Не сливать целиком. Перенести материал вручную после claim-ledger, 40+ sources, PDF-проверки и локализации медиа. |
| #37 | `work/local-images-playwright-wtoc` | основной исследовательский агент | source policy, пять лонгридов, локальные архивные изображения, SEO/prerender, Playwright и research corpus | Главная исследовательская ветка. Draft, конфликтует с новым audio-main. Не force-push; интегрировать после стабилизации PR #45. |
| #38 | `audit/playwright-total-article-check` | прежний audit agent | альтернативный browser audit/renderer | Не сливать целиком. Reduced-motion test уже извлечён. Осталась отдельная идея stable block ids. После её переноса/issue — закрыть как superseded by #37. |
| #44 | `validation/research-source-gates-20260723` | временная CI-ветка #37 | наблюдаемый Actions-run поверх исследовательской ветки | Не сливать. После завершения CI записать результаты и закрыть PR; marker-файл не должен попасть ни в #37, ни в `main`. |
| #45 | `fix/audio-runtime-hardening` | активный аудиоагент | persistence, retry, cross-tab coordination, focus trap, safe-area и исправление глобального аудиодвижка | Чужая активная зона. Не редактировать audio runtime/community/binaries из #37. После merge #45 его версия становится канонической для интеграции. |

## Уже слитая аудиоцепочка

Следующие PR закрыты как merged и не должны cherry-pick’аться повторно:

| PR | Роль |
|---:|---|
| #39 | рейтинги, музыкальный архив, release pages, MP3 manifest, Supabase/RPC |
| #40 | удаление временных metadata/JPEG-дублей |
| #41 | финальная раскладка Yesenin WebP в `public/images/music` |
| #42 | premium player polish и release pages |
| #43 | persistent global audio context, mini-player, immersion mode, waveform и Media Session |

Повторный перенос этих коммитов в #37 создаст дубли маршрутов, providers и storage migrations. При интеграции используется текущий `main`, а не отдельные старые ветки.

## Исторические merged-ветки

PR #1–#31, #33, #35–#36, #39–#43 уже представлены в истории `main`. Их refs не являются незавершённой работой, даже если физически остаются в REMOTE.

Операция удаления refs сейчас не выполнялась по трём причинам:

1. инструмент не дал надёжного полного списка refs с branch-protection metadata;
2. часть старых refs может использоваться как база или ссылка в отчётах/Actions;
3. удаление веток не улучшает код и должно идти только после закрытия всех зависимых PR.

## Что можно будет удалить после завершения

- `validation/research-source-gates-20260723` — сразу после закрытия #44;
- `audit/playwright-total-article-check` — после extraction ledger и закрытия #38;
- `work/yesenin-visual-series` — после публикации проверенной части I и закрытия #34;
- `archive-collage-real-photos` — после repair pass либо документированного отказа;
- merged audio feature branches — после подтверждения, что #45 не использует их как base.

## Что нельзя удалять сейчас

- `main`;
- `work/local-images-playwright-wtoc`;
- `fix/audio-runtime-hardening`;
- любые ветки, на которые ещё открыт PR;
- любые refs, участвующие в текущем GitHub Actions run.

## Порядок безопасной уборки

1. Закрыть временный #44 после CI.
2. Закрыть #38 после переноса stable block-id идеи либо создания issue.
3. Перенести и проверить часть I Есенина; закрыть #34.
4. Решить судьбу #32 после provenance repair.
5. Дождаться merge/закрытия #45.
6. Интегрировать актуальный `main` в #37 и получить зелёный CI.
7. Только затем удалить refs закрытых PR по одному, без массовой команды и без force-update.
