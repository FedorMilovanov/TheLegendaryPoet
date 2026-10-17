# Аудит и рабочий план сессии — 2026-10-13

## Статус и границы

**Исходный результат 2026-10-13: baseline исследован, план подготовлен; исправления ещё не выполнялись.**
Последующее выполнение фиксируется в конце документа; baseline observations сохраняются как evidence at anchor.
Это датированный план сессии по запросу владельца, не новая MASTER-матрица,
не разрешение публикации исследовательских материалов и не production certification.
Текущая engineering-матрица остаётся в `AuditRepo/projects/the-legendary-poet/verified/MASTER_BUG_MATRIX.md`.

В исходной audit-транзакции изменялся только этот документ. Runtime, зависимости, контент,
`.github`, права, production и чужие ветки не изменяются. Новые architecture IDs не вводятся.

### Зафиксированные anchors

| Поверхность | Проверенный anchor |
|---|---|
| Product baseline, чистый HEAD до генерации/проверок | `090ea18233ca4888de1ea854d05d27f4e14c7eae` |
| Ветка сессии | `arena/501e410b-thelegendarypoet` |
| AuditRepo, read-only checkout | `3831d1c1a719f079e9e617598df55efa7678e6ab` |
| Research, read-only checkout | `50f1886a1d8a5569d6c244bee9287d7158bac55d` |
| Сохранённый research archive Product | `909df9f73b8d9be6faa58cbee767603954e3fb17` |

GitHub API подтвердил Product `main == baseline` и один открытый PR #514 перед оформлением плана.
Существующие успешные main-runs: CI `34790865247`, contracts `34790865301`,
route audit `34790865260`, Manual Browser QA `34790865217`, Pages `34790865246`.
Pages deployment привязан к baseline SHA и завершён 2026-09-13; это **исторический
GitHub delivery witness**, не повторная проверка живого сайта 2026-10-13.

## Что прочитано и как выбиралась authority

- Product: `AGENTS.md`, `AGENT_ANTI_REGRESSION_PROTOCOL.md`, `ARENA_PROJECT_PROTOCOL.md`,
  `README.md`, `PROJECT_CHARTER.md`, `POET_AUTHORING_GUIDE.md`,
  `PROJECT_RESTORE_MASTER.md`, `TEXT_MIRROR_RULES.md`.
- Текущие контракты: `docs/CURRENT_STATE.md`, `docs/project-contract.json`,
  `docs/RELEASE_POLICY.md`, `docs/APP_SHELL_RUNTIME.md`, `docs/BRAND_EMBLEM.md`,
  route/discovery registries, Hall-v3 machine contract, README и owner-gated roadmap.
- Редакционные стандарты: `docs/EDITORIAL_JUDGMENT_AND_SOURCE_POLICY.md`,
  `docs/HISTORICAL_NARRATIVE_STANDARD.md`, `src/docs/THEOLOGICAL_GUIDELINES.md`;
  research/source indexes и правила переноса портретных референсов.
- Community: `docs/COMMENTS_SETUP.md`, `workers/community-api/README.md`, issue #497,
  AuditRepo `REVERIFY_090ea18_2026-09-28_community-live-proof-boundary.md`.
- Scripts/CI: package scripts, основной CI, contracts, deploy, merge certification,
  shared actions, browser/route workflows, Playwright configs и запускаемые guards.
- AuditRepo: operating model, contributing/concurrency/multi-witness protocols,
  TLP README, DOC_MAP, MASTER, WORK_QUEUE, system themes, последние closure entries,
  исторический orchestrator handoff. Его 30 старых roots не являются текущей очередью.
- Research: `AGENT_RULES.md`, `CURRENT_AUTHORITY.md`, root/control-plane authority,
  root registry, `SOURCE_LIBRARY/README.md`, portrait review/allowlist.
  В Product archive прочитаны research entrypoints/source policy; дерево получено целиком.

Инвентаризация Product: 727 tracked files, 131 Markdown-документ;
контент-гейт: 10 поэтов, 34 стихотворения, 10 эссе, 3 музыкальных релиза.
Проведены сквозные автоматические проверки и ручное чтение ключевых owners, а не
построчная экспертиза каждого файла/исторического отчёта. Все цитаты, изображения и
все несвязанные корпуса Research заново по первоисточникам **не проверены**.

### Существенные противоречия документации

1. `docs/CURRENT_STATE.md` говорит о placeholder `/hall` и блокировке production WebGL.
   `docs/hall-v3/hall-v3-contract.json` содержит `phase=webVerticalSlice`,
   `productionRoute.mode=web-vertical-slice`, `allowThreeRuntimeImports=true`.
   `HallPage.tsx` подключает `HallProductionRuntime`; браузер подтверждает `mode=webgl`.
   Owner direction #465 и последующая #466 — основание bounded web slice, не прав на документальные изображения.
2. `docs/APP_SHELL_RUNTIME.md` всё ещё предписывает Lenis, хотя текущий
   `SmoothScroll.tsx` управляет native restoration, а AuditRepo фиксирует удаление Lenis.
3. `PROJECT_RESTORE_MASTER.md` предписывает старый SVG `BrandMark.tsx`,
   конфликтующий с `AGENTS.md` и утверждённым raster materializer.
4. Зелёный `validate-project-contracts.mjs` эти расхождения не обнаруживает:
   наличие зарегистрированного документа не доказывает актуальность его утверждений.

Правило этой сессии: не откатывать код под устаревший текст; сверять конкретный
machine owner, реализацию, owner decision и evidence. Общий charter сохраняет
редакционную власть, но не восстанавливает retired техническую архитектуру.

## Ветки и конкурирующие работы

Снимок до публикации ветки сессии: **9 remote Product refs**, 1 open PR, 1 open issue.
Числа ahead/behind получены GitHub compare относительно baseline `main`.
Они показывают историю коммитов, а не отсутствие/наличие уникального полезного кода после squash.

| Ветка | ahead / behind | Решение для плана |
|---|---:|---|
| `main` | 0 / 0 | Источник baseline; не писать |
| `archive/deep-research-local-images-20260724` | 787 / 983 | Сохранить; только точечное извлечение доказательств |
| `fix/deps-fflate-20260914` | 2 / 2 | PR #514 открыт; не дублировать lockfile repair |
| `fix/ga4-command-queue-shape-20260913` | 2 / 6 | #509 closed/unmerged; сверять с поглощением в #510 |
| `fix/light-focus-contrast-20260913` | 2 / 7 | #508 closed/unmerged; ledger фиксирует перенос в #507 |
| `repair/runtime-integrity-450` | 10 / 31 | #451 closed/unmerged; extraction только после current-check |
| `repair/tlp-a11y-runtime-492` | 12 / 14 | Нет open owner; сравнить с #502, не сливать ветку |
| `repair/tlp-analytics-route-477` | 10 / 21 | Нет open owner; сравнить с #501, не сливать ветку |
| `repair/tlp-audit-outcomes-495` | 2 / 14 | #496 closed/unmerged; сверять с #506 |

Archive tree: 790 файлов, включая 164 research Markdown; tree API `truncated=false`.
Compare API для archive достиг лимита 300 файлов: это не полный semantic diff.
Индивидуальный verdict о потере/извлечении каждого архивного claim не вынесен.
Никакие refs не удалялись и не объявлялись безопасными для удаления.

AuditRepo: 14 веток, 1 open PR (#482, другой проект).
Research: 29 веток, 5 open PR (#182, #207, #210, #212, #215), по названиям не TLP.
Их unrelated content не становится scope этой сессии; чужие репозитории read-only.

## Baseline: реально выполненные проверки

Все команды ниже запускались до tracked-изменений. После генерации tracked tree остался чистым.

| Гейт | Результат |
|---|---|
| `npm ci` | PASS, 169 packages added; audit сообщил исходные уязвимости |
| `node scripts/validate-project-contracts.mjs` | PASS, 0 open architecture lanes |
| `npm run check` | PASS, включая content/stores/brand/Hall/interaction/typecheck |
| command-search, audio-release-gate, reader-text, theme-contract | PASS |
| Hall offline-exhibit, offline-budget, web-runtime-proof; daily-content | PASS |
| `npm run build` + `validate:build-output` | PASS, 14 route chunks |
| `seo:generate`, `prerender`, `validate:seo-output` | PASS: 31 canonical URLs, 5 aliases, 40 HTML |
| Повторный `seo:generate` | sitemap/feed SHA-256 неизменны |
| Wrangler `4.120.0 deploy --dry-run`, фиктивные CI secrets | PASS, bundle 30.18 KiB; deploy не выполнялся |
| `npm audit --json` | FAIL: 1 moderate + 4 high package entries, 0 critical |
| Полный локальный route suite, 44 tests | **42 PASS / 2 FAIL**, 436.6 s |
| Изолированный повтор Simonov image test | PASS, исходный FAIL не стёрт |
| Изолированный повтор lazy `/privacy` test | FAIL при `reduce` и отдельно `no-preference` |

Content warnings: 19 сообщений = library 1 + essays 1 + covers 4 + citations 11 + style 2.
Это не 19 независимых дефектов: citations повторяют несколько unresolved sources.
Нет URL у свидетельства Пастернака о Маяковском; source 6 Симонова требует уточнения;
есть предупреждения о размерах обложек, источниках без URL и редакционной лексике.
Предупреждения не исправлены выдуманными ссылками или косметическим подавлением.

Build raw bytes: entry **635244 / 665000**, суммарный JS **1731821 / 1800000**,
CSS **263435 / 300000**. Бюджеты проходят, но JS использует примерно 96.2% ceiling.
Это повод измерять дальнейший рост, не автоматически повышать лимиты или начинать рефакторинг.

### Browser witness и ограничения измерений

Chromium **153.0.8010.0**, axe-core **4.14.0**; production build без production community/analytics variables.
9 URL × 2 режима: `/`, `/poets/`, `/poets/alexander-pushkin/`, `/articles/`,
`/essays/yesenin-kutezhi/`, `/ratings/`, `/music/`, `/archive/`, `/hall/`.

- Desktop: 1440×1000, `isMobile=false`, dark, `reducedMotion=no-preference`.
- Mobile: 390×844, DPR 2, `isMobile=true`, touch, dark, `reducedMotion=reduce`.
- 18 screenshots; просмотрены desktop/mobile home, footer и mobile Hall,
  также screenshot первоначального Simonov failure. Не заявляется визуальный approve всех 18.
- В 18 smoke-навигациях: 0 pageerrors, 0 horizontal overflow, 0 broken viewport images.
- Локальные Inter/Cormorant WOFF2 загружены. `Inter Fallback` с `local('Arial')`
  имеет error в sandbox без Arial; это не отказ self-hosted webfonts.
- Два console/request failures: один и тот же Wikimedia файл `Esenin1914 (2).jpg`
  на desktop/mobile essay. **skipped: sandbox egress**; production availability не установлена.
- axe: contrast violations во всех 18 проверках; `aria-prohibited-attr` на home в обоих режимах.
  Всего 563 node occurrences с повторами общих компонентов — не 563 отдельных bugs.
  `incomplete` contrast results не считаются PASS, требуют ручной проверки.
- Повтор после scroll к footer: 13 contrast node failures в каждом desktop motion-режиме.
  Примеры на `#050505`: обычные ссылки ~4.44:1, secondary text ~2.86:1,
  нижний текст ~1.88:1. Это видимый текст, не только декоративные линии.
- Наблюдаемый LCP 152–620 ms, desktop layout-shift sum 0.033–0.221, mobile 0.
  Это unthrottled local lab, не Lighthouse score, не полевые Core Web Vitals.
- Fresh desktop home повтор в обоих motion-режимах: один shift **0.219**,
  source — footer, до смены loading-shell видимый начиная с y≈781, затем вне viewport.
- Mobile Hall при scrollY=0: h1 y=64…97, header y=0…81;
  `elementFromPoint` в верхней части h1 попадает в header. WebGL работает,
  но открытие страницы само по себе не доказывает корректную геометрию.

## План выполнения: небольшие работы по общим причинам

Номера ниже — пункты плана, **не новые canonical finding IDs**.
Каждый пункт начинается с повторного ownership/main-check и заканчивается проверкой,
commit+push в ветку сессии, обновлением единственного PR. Ничего не merge/close.
Незавершённый пункт остаётся явно незавершённым; большой scope не упаковывать в mega-PR.

### 1. Согласовать authority документов и guards — первым

**Причина:** техническое состояние продублировано в прозе и перестало следовать owner-контрактам.
**Owner:** `docs/project-contract.json`, `validate-project-contracts.mjs`, актуальные runtime docs.
Обновить Hall/scroll описания по существующим owners; обозначить obsolete restore-инструкции
как исторические. Не создавать ещё один parallel registry/генератор документации.
Добавить узкие regression fixtures: запрещённый placeholder при активном web slice,
Lenis-guidance при native-scroll authority; не тестировать только точные старые фразы.
**DoD:** contracts/check PASS; negative fixtures действительно отклоняют противоречия;
права/approved brand не ослаблены. **Rollback:** только docs/guard change, без runtime rollback.

### 2. Разобрать красный lazy-discovery baseline до изменения SEO

**Доказано локально:** `/about → /privacy` с 1.5 s delayed JS показывает Privacy content,
но `link[rel=canonical]` остаётся отсутствующим; 3 FAIL включая suite и 2 isolated runs.
**Owner для исследования:** `routeModules.ts` → `discoveryHead.ts` → `useSeo.ts` и navigation settlement.
Сначала повторить в CI-pinned Chromium и снять порядок head mutations; отдельно проверить
пользовательский Link, быстрые A→B→C, slow/offline/recovery, POP и cold/warm routes.
Причина и переносимость на CI-браузер пока **не установлены**; историю зелёного CI не замалчивать.
Если подтверждено: один владелец актуального navigation/head lifecycle, без таймеров
«починить canonical позже», без page-specific DOM patch и без ослабления существующего теста.
**DoD:** исходный test + race/recovery fixtures PASS, SEO/prerender/aliases не регрессируют.
**Rollback:** только navigation/head-owner transaction. Simonov flake исследовать отдельно,
не маскировать увеличением timeout и не приписывать egress без network evidence.

### 3. Доступность: общие семантика и токены, не правки каждой страницы

**Owners:** `KineticText.tsx`, `Footer.tsx`, существующие `theme.css` tokens и contrast QA.
У KineticText default `span` получает запрещённый `aria-label`, а буквы `aria-hidden`.
Обеспечить единый доступный текст для всех tag-вариантов, сохранив heading semantics;
проверить accessibility tree, не заменять текст произвольным role ради axe.
Перевести функциональный secondary text на существующую тему с проверяемым контрастом,
начиная с footer; затем дедуплицировать остальные axe-селекторы по shared components.
**DoD:** dark/light, desktop/mobile, реальный Tab/focus/hover, axe WCAG A/AA,
ручная проверка gradient/incomplete; не менять theme только ради порогов сканера.
**Rollback:** каждый shared owner отдельным малым коммитом, без массового CSS replace.

### 4. Геометрия shell/loading и Hall

**Причина CLS:** loading-shell `min-h-[68vh]` допускает footer в первый viewport;
после lazy mount длинной страницы footer резко уходит вниз.
**Owner:** layout/loading boundary, не 14 индивидуальных page spacer-ов.
Сделать стабильный контракт первого viewport, затем проверить cold/warm/slow navigation,
ошибки, reduced motion и tall/short screens. Не скрывать footer из accessibility tree.
**Отдельный bounded substep:** Hall content-inset относительно фиксированного header;
использовать согласованную shell geometry, не случайный offset для одного телефона.
**DoD:** attributed CLS <0.1 на cold samples, отсутствие header/h1 occlusion,
Hall camera/context-loss/fallback и существующие shell/browser tests PASS.
**Rollback:** layout и Hall inset независимо; никакого изменения H3/R1/L0/UV0 или прав.

### 5. Dependencies — согласовать существующего владельца

PR #514 уже чинит `fflate` (0.8.2 и nested 0.6.10); он на 2 коммита позади main.
Его прежний «npm audit: 0» не является текущим доказательством: появился другой advisory set.
Текущие цепочки: `vite-plugin-singlefile → micromatch → braces`,
`@tailwindcss/node`/PostCSS → `source-map-js`, Three-related → `fflate`.
Не применять `npm audit fix --force`: npm предлагает downgrade singlefile до 0.9.0.
Vite production config уже не использует singlefile; перед удалением проверить все consumers.
**Порядок:** согласовать package ownership/scope с владельцем, проверить reachability,
точечно обновить/удалить ненужный root dependency npm-командой, не ручным churn lockfile.
**DoD:** fresh npm ci/audit, typecheck, полный build/budgets/browser/Hall guards;
residual advisories явно классифицированы. **Rollback:** согласованная manifest+lock пара.

### 6. Production community P1 — отдельный человеческий gate

AuditRepo MASTER содержит один активный root: `TLP-COMM-ABUSE-001`, Product #497.
Engineering certifier уже есть; не писать второй и не обходить Turnstile.
Нужны два свежих обычных browser profiles, легитимные signed sessions, скрытый local TTY,
актуальные deployed Worker/Pages revisions и работоспособный exact-row cleanup.
Секреты/actor tokens не передавать в чат, argv, env или файлы.
Arena bash без controlling TTY не является заменой операторскому терминалу.
**DoD:** sanitized PASS concurrency/idempotency/changed-payload/rotated-actor/unknown-target
и отсутствие временных записей после cleanup. До этого issue и P1 остаются открытыми.
Учесть известную Windows `npx.cmd` cleanup hazard из AuditRepo; не запускать write proof
на неподтверждённом cleanup path. Без этой процедуры source tests не закрывают live boundary.

### 7. Research/editorial и архивы — только после конкретного выбора материала

Не импортировать archive runtime/workflows и не возвращать старый Article engine.
Для нужного claim: exact source → edition/page/context → независимое подтверждение →
текущий Essay block → provenance/rights/credit → publication decision.
Research allowlist разрешает reference archive, а не автоматически production portrait.
40 PDF / 12434 страницы — исторический package; durable custody требует receipt/readback.
Library A+/A и Research A1/A2/A3 — разные схемы; не переносить буквы классов механически.
Начать с 19 предупреждений как списка кандидатов, а не менять цитаты для зелёного validator.
Hall documentary rights, offline visual approval, fullMuseumScaleOut остаются заблокированы.
Дополнительные поэты, музейный scale-out и общая очистка веток в текущий scope не выбраны.

## Среда, воспроизводимость и незакрытые проверки

- Работают git/gh read API, npm registry, `npm ci`, Node **22.22.3**, npm **10.9.8**,
  gcc/readelf, ImageMagick fallback materializer, Wrangler dry-run, local static preview.
- Node удовлетворяет engines, но это не CI Node 24. WebKit/iPhone, locked Chromium,
  полная interaction matrix и production integrations локально не сертифицированы.
- Browser tools установлены отдельно в gitignored `qa-artifacts/browser-tools`,
  без изменения Product package/lock. Chromium из npm, NSS из `@achingbrain/nss`;
  sandbox-only ELF NSS version/hash patch + `PK11_HasAttributeSet` preload shim.
  Это лабораторный launcher, не production dependency и не TLS/security-certification среда.
- Preview использует копию Pages-like server, изменённую только в ignored tools на
  `0.0.0.0:4173`; tracked server/.github не тронуты. Клиент не получил localhost API URL.
- Внешний bash-egress не предполагается открытым; apt не использовался.
  Google Drive и исходные приватные материалы не запрашивались/не проверялись.
- Lighthouse не запускался; LCP/layout shifts сняты PerformanceObserver.
  Smoke не доказывает все scroll states, все lazy images, Safari или live D1/GA4.
- Evidence: `qa-artifacts/session-audit/{check,build,extra-gates,route,smoke,focused}.log`,
  `npm-audit.json`, `branch-comparison.json`, `route-results.json`, `smoke.json`,
  `focused.json`, `hall-geometry.json`, isolated-recheck logs и `lazy-failure/`.
  PNG, binaries, полные clones и browser packages в Git не добавляются.
- Это docs-only diff: baseline дефекты не исправлены, delta runtime/build ожидается 0.
  Финальный SHA, PR и свежие CI outcomes фиксируются в PR/отчёте, не подменяют baseline.

## Что требуется от владельца

Для принятия этого аудита — прочитать приоритеты; ничего устанавливать или присылать секреты не нужно.
Для реализации dependency lane — согласовать ownership с #514.
Для закрытия #497 — отдельный безопасный human-backed operator run.
Для публикации новых источников/медиа — конкретный editorial/rights scope.
Слияние/закрытие PR этой сессии агентом **не выполняется**.


## Выполнение — 2026-10-14: шаг 1

- Исправлены актуальные Hall/scroll инструкции; `PROJECT_RESTORE_MASTER.md` явно
  зарегистрирован как historical/superseded, его старое содержимое не переписано.
- Таблицы текущих фактов сверяются с существующими JSON owners через project-contract
  gate. Native-scroll guard также проверяет зарегистрированный режим. Это проверка
  структурированных фактов, не автоматическая экспертиза произвольной прозы.
- 20 regression tests PASS; полная команда project-contracts отклоняет 3 отдельные
  мутации в изолированной копии: placeholder Hall, Lenis mode, documentary-rights promotion.
- Clean baseline `8caa3e0`: npm ci/contracts/check/build PASS; исходные 5 advisories сохранены.
  После изменений contracts/check/build/budgets/prerender/SEO PASS; 55 build-output rows
  совпадают с baseline. Runtime, package/lock и `.github` не менялись.
- Шаг 1 реализован в ветке, не смержен. Остальные исправления не выполнены.
- По шагу 2 получено независимое свидетельство: GitHub route audit `38470242670`
  на `8caa3e0` завершился SUCCESS. Локальный lazy-canonical FAIL пока остаётся
  engine/environment-sensitive наблюдением, а не доказанным production-дефектом.

## Выполнение — 2026-10-14: шаг 2, QA-синхронизация

- Доказана конкретная причина ложной готовности: helper принимал ещё видимый h1
  `/about` за завершённую `/privacy`. Исправлен общий QA-helper и вызов lazy-теста,
  а не runtime SEO. История исходного FAIL выше остаётся evidence at anchor.
- Таймаут canonical 5000 ms, loading/og:url/JSON-LD assertions сохранены.
  Намеренно отсутствующий canonical по-прежнему отклоняется тем же гейтом.
- Lazy-canonical после изменения: 9/9 PASS (desktop reduce/no-preference и mobile).
  Вся локальная расширенная выборка: 20/21; один offline-alert FAIL не закрыт.
- Contracts/check/build/budgets/prerender/SEO PASS; 55 build-output rows идентичны
  чистому baseline `bd897f9`. Runtime, зависимости и `.github` не менялись.
- Root cause, границы доказательства, оставшийся FAIL и воспроизведение:
  [`QA_CANONICAL_INVESTIGATION_2026-10-14.md`](QA_CANONICAL_INVESTIGATION_2026-10-14.md).
- Исправление ограниченной QA-причины выполнено; полная сертификация browser suite
  и остальные product/UI исправления этим шагом не объявляются завершёнными.

## Выполнение — 2026-10-14: шаг 3, доступность общего текста

**Baseline:** clean `93d504e`; main по-прежнему `090ea18`. На baseline основной CI,
route audit и все запущенные Browser QA SUCCESS. npm ci/contracts/check/build PASS;
5 исходных dependency advisories сохранены.

**Две ограниченные причины и владельцы:**
- `KineticText`: aria-label на generic span/p недопустим, а анимированные буквы
  скрыты от AT. Компонент теперь даёт один `sr-only` текстовый слой для всех пяти
  поддерживаемых тегов; visual words остаются aria-hidden. Текст, буквы и motion
  не переавторены. Production usages — два h2 главной; SSR→AX-проба всех пяти
  тегов подтверждает единственный доступный текст и сохранение heading levels.
- `Footer`: локальные полупрозрачные цвета текста обходили существующие theme
  contracts. Общий footer переведён на текущие semantic surface/text/control
  классы; keyboard focus использует общий focus ring вместо локального cyan-ring.
  Новых палитр, CSS-движков и исправлений отдельных страниц нет.

**Регрессии:** три новых browser tests добавлены в уже запускаемые CI файлы
`qa/reader-text.spec.mjs` и `qa/theme-contrast.spec.mjs`. Все три падали до repair
(ARIA / dark contrast / light contrast). Тест footer проверяет ≥20 текстовых узлов
с порогом 4.5:1, focus indicator ≥3:1, keyboard Tab и settled hover/focus colors.
Исключён только неизменённый gradient logotype, не его описательная подпись.
Существующий contrast helper научен преобразовывать современные computed CSS colors
через canvas; пороги не ослаблены. Desktop theme/reader suite: 11/11 PASS; новые
mobile tests: 3/3 PASS; усиленная проверка завершившихся focus/hover transitions
дополнительно повторена отдельно.

**Axe 4.14 / Chromium 153 (диагностический NSS-shim), dark-first:**
- Desktop 1440×1000/no-preference, mobile 390×844/DPR2/touch/reduce; обе темы.
- `aria-prohibited-attr`: 2 → 0 в каждой из четырёх проверок.
- Footer contrast violations: desktop dark 13 → 0, mobile dark 15 → 0,
  desktop light 0 → 0, mobile light 1 → 0. Независимый computed test также
  обнаруживал light tagline 4.13:1, даже когда axe его не включал в violations.
- Минимальный измеренный axe text contrast после: dark 9.3:1, light 5.18:1.
- Скриншоты после reveal проверены; 0 page/console errors и failed requests;
  6 self-hosted font faces loaded, 8 viewport images decoded в каждой пробе.
- Unthrottled LCP before→after: desktop dark 576→672 ms, light 272→264 ms;
  mobile dark 208→316 ms, light 216→228 ms. Это не field/performance certification.
  Initial CLS session window неизменён: desktop 0.220508 dark / 0.214028 light,
  mobile 0. Loading-shell/footer shift около 0.219 **не исправлен**.

Contracts/check/build/budgets/prerender/SEO PASS. Единственный generated source
артефакт — обновлённые 31 fingerprints в `public/discovery-manifest.json`, полученные
штатной генерацией; URL/state/lastmod не менялись. Бюджеты: entry 635244→635142 B,
JS 1731821→1731754 B, CSS 263435→263004 B. Dependencies и `.github` не менялись.

**Границы:** только эти shared text defects исправлены в ветке, не смержены.
Прочие mobile/page-level contrast findings, Hall geometry, loading CLS и ранее
отмеченный offline-alert остаются открытыми. Ручной NVDA/VoiceOver не выполнялся;
AX tree/axe не заменяют такую проверку. Миграции данных нет; rollback — компоненты,
их guards и повторная штатная генерация fingerprints. Логи/снимки/AX-пробы —
ignored `qa-artifacts/a11y-step/`; закрытие в AuditRepo до merge не производится.

## Выполнение — 2026-10-14: шаг 4, карточки и общие подписи

**Baseline:** clean `66e630d`, main `090ea18`; npm ci/contracts/check/build/prerender
PASS, все запущенные exact-head CI предыдущего шага SUCCESS. Четыре новых проверки
карточки/подписи главной сначала FAIL в обеих темах: light text 2.02:1 / label 1.33:1.

**Причина / общий владелец / границы:**
- `PoetCard` обходил theme contracts полупрозрачными локальными цветами. Теперь тело
  имеет непрозрачную theme surface, semantic text и читаемое золото в обеих темах;
  portrait badges — явные непрозрачные dark islands. Tilt, геометрия, данные и links
  не менялись. Hover/focus заголовка сохраняют золотой акцент.
- `FeedbackMiniSummary` наследует island/page text token; заполненные счётчики
  проверены в PoetCard и TrackReleaseCard. Фикстуры — только browser localStorage,
  пустой outbox, без backend writes; архив содержит настоящий `pushkin-1`.
- `.section-label` использует общий role token: cyan в dark, существующий primary
  ink в light, island accent внутри dark islands. Все владельцы покрыты: Home,
  Music, MyArchive, NotFound, ErrorBoundary. Light Music требует более тёмного ink:
  image/gradient backdrop дал около 4.02:1 на снимке при ложном успехе ancestor-only
  расчёта. Новый worst-backing guard падал 2.30:1 и проходит после исправления.
- ErrorBoundary сохраняет тёмную панель: прежний составной `bg-[gradient,color]`
  компилировался в недопустимый background-color. Solid background и gradient
  разделены, inherited text явно island-aware. Recovery/navigation не менялись.

**Проверено:** final desktop theme/reader suite **25/25 PASS**, новые mobile
**14/14 PASS**; text ≥4.5:1, keyboard focus ≥3:1, idle/settled hover/focus,
заполненные отзывы и архив. Measurement helper считает тот же contrast одним
browser task вместо десятков CDP round trips; thresholds/timeouts не увеличены.
Render-error fixture ломает только локальный route module при initial navigation;
это проверка реального ErrorBoundary, не закрытие прежнего offline-alert FAIL.

Axe 4.14, `/` и `/poets`, desktop/mobile, dark/light — восемь проб:
- Dark card: по одному violation (fullname 3.94:1) → **0**; incomplete nodes 2 → **0**.
- Light card: 0 violations, но 12 incomplete → **0 violations / 0 incomplete**.
  Поэтому исходное «0 violations» не считалось успехом; computed red выявил 2.02:1.
- Минимальный измеренный card contrast после: **8.26:1 dark / 5.62:1 light**.
- Home label: по одному violation → **0**, без incomplete, во всех четырёх режимах.
- Дополнительные Music/error-panel axe пробы: 0 violations, но 1/4 incomplete nodes
  соответственно; они не объявлены axe-clean. Дополнительно проверены computed
  contrast, darkest-backing contract и изображения обеих тем.
- Во всех восьми обычных пробах: 0 page/console errors и failed requests,
  6 loaded font faces, portrait naturalWidth 1000. Card и label screenshots просмотрены.

**Среда / ограничения измерений:** Node 22.22.3, npm 10.9.8, Chromium 153.0.8010.0
с прежним NSS shim. Desktop 1440×1000/no-preference; mobile 390×844/DPR2/touch/reduce.
SwiftShader в sandbox зависал на capture. Element/page/clip capture и CSS animation
freeze не устранили сбой; `--disable-gpu` с удалением use-gl/use-angle/in-process-gpu/
enable-unsafe-swiftshader позволил получить реальные снимки. Только capture выключает
CSS animations; functional desktop tests сохраняют no-preference. Browser/QA configs
локальные, ignored; production/CI flags не менялись. LCP after (Home/Poets): desktop
 dark 384/372 ms, light 1092/408 ms; mobile dark 300/268 ms, light 276/300 ms.
Это не performance certification и не сопоставимый LCP delta: compositor отличается
от baseline. Initial CLS: desktop dark Home/Poets 0.220508/0.220405 без изменений;
light 0.214028/0.213999 → 0.213/0.213067; mobile 0 → 0. Большой loading shift
0.213–0.219 **не исправлен**, улучшение CLS не заявляется.

Contracts/check/build/budgets/prerender/SEO PASS; entry 635142→635177 B,
JS 1731754→1731628 B, CSS 263004→263027 B. Discovery manifest после штатной генерации
байт-стабилен. Dependencies, `.github`, бренд, контент и другие repos не менялись.
Логи, scripts, before/after JSON и PNG: ignored `qa-artifacts/card-step/`.
Миграции данных нет; rollback — этот shared UI diff и его regression guards.
Ремонт выполнен в session branch; merge/production/AuditRepo closure не выполнены.
Manual AT, весь сайт WCAG, оставшиеся page-level contrast, Hall geometry и offline
recovery не сертифицированы этим шагом. Exact-head CI отражается отдельно в PR.

## Выполнение — 2026-10-15: шаг 5, reservation первого viewport

**Baseline:** clean `d57d18f`, main `090ea18`. Все запущенные exact-head CI шага 4,
включая Manual Browser QA, SUCCESS. До изменений npm ci/contracts/check/build/
prerender/budgets PASS. Из-за восстановления sandbox Git metadata сначала сверены
с remote по байтам; предыдущие изменения не переписаны и чужие ветки не использованы.

**Причина и один owner:** `SiteLayout` не задавал минимальную высоту `main`.
Внутренняя reservation loading skeleton (68vh плюс intrinsic content) впускала
footer в первый viewport: например, y≈787 при H=1000. После lazy mount длинной
страницы footer уходил за экран с layout-shift contribution 0.219.
`main` теперь использует существующий `min-h-screen` (100vh), одинаково для loading,
ready и page error. Header fixed, его высота не вычитается. Footer остаётся в потоке,
в accessibility tree и доступен прокруткой; page spacers/opacity hacks не добавлены.
Runtime diff — один class token. Hall inset, recovery, контент и brand не изменены.

**Регрессии:** 10 новых cases в уже запускаемом `qa/shell-noise-singleton.spec.mjs`.
До repair: 7 FAIL на reservation, 3 PASS (короткий desktop и mobile). После: вместе
с существующим singleton guard **11/11 PASS**. Покрыты dark/light, desktop H=600/
1000/1200, mobile 390×844, reduce/no-preference; cold gate, delayed SPA, warm reuse,
short-content fixture и настоящий ErrorBoundary. Проверяются footer DOM identity,
прокрутка к ссылке, сумма cold shifts <0.1 и footer-attributed shifts <0.01.
Сумма без session-window отсечения строже CLS; другие shift sources не исключаются.
Дополнительно theme/reader **25/25**, route metadata/lazy/recovery **3/3**, loading
brand **1/1** — итого **40/40 PASS**. Прежний локальный offline-alert сейчас не
воспроизвёлся; это не доказательство исправления recovery этим CSS-изменением.

**Шесть одинаково настроенных cold probes с задержанным route chunk:**
| Условие | CLS before | CLS after | Footer y after |
| --- | ---: | ---: | ---: |
| Desktop dark 1440×1000 | 0.220508 | 0.001508 | 1080 |
| Desktop light 1440×1000 | 0.213000 | 0.001028 | 1080 |
| Short dark 1280×600 | 0.003121 | 0.003121 | 787.22 |
| Tall light 1280×1200 | 0.253333 | 0.001054 | 1280 |
| Mobile dark 390×844 | 0 | 0 | 924 |
| Mobile light 390×844 | 0 | 0 | 924 |

Footer attribution after — **0 во всех шести случаях**; оставшиеся небольшие shifts
относятся к header/font layout. Это bounded repair, не гарантия CLS всего сайта.
Снимки loading/ready просмотрены; в каждой пробе 6 font faces loaded, все 2–8
viewport images decoded, 0 page/console errors и failed requests. Axe main/footer:
0 violations; contrast incomplete nodes 34/34/25/43/67/46 сохранены как ограничения,
не названы WCAG-сертификацией. Observed LCP after 368/312/256/320/236/240 ms;
искусственный chunk gate и screenshot protocol не дают performance certification.

Среда перепроверена после перезапуска: Node 22.22.3/npm 10.9.8, Chromium 153.0.8010.0,
NSS shim и CPU rendering; production/CI browser flags не менялись. Исходные ignored
before/red артефакты не пережили перезапуск; их результаты выше записаны из реально
выполненных проверок. После восстановления повторены все after/browser/build gates;
свежие JSON/PNG/logs лежат в ignored `qa-artifacts/shell-step/`.

Contracts/check/build/budgets/prerender/SEO PASS. Entry 635177→635190 B, JS
1731628→1731641 B, CSS 263027→263083 B. Штатно обновлены 31 source fingerprints
в discovery manifest; URL/state/lastmod не менялись. Dependencies и `.github`
не менялись. Data migration отсутствует; rollback — main class, guard, документация
и повторная штатная генерация fingerprints. PR остаётся draft/open; merge,
production/AuditRepo closure и отдельный Hall geometry substep не выполнялись.

## Выполнение — 2026-10-15: шаг 6, Hall и fixed chrome

**Baseline:** clean `3bd67f1`, все 9 запущенных exact-head workflows SUCCESS.
После восстановления окружения source/build/prerender/budgets PASS. 80 route/shell/
theme/reader cases прошли: 78 сразу, два 404 — после замены ошибочного ad-hoc SPA
server на canonical Pages-like server (только host изменён на 0.0.0.0). Это ошибка
первого harness, не ремонт приложения. Существующие 4 Hall WebGL tests PASS.

**Новый воспроизводимый дефект:** title panel начинался на y=32 desktop / y=20
mobile при header bottom=81. Mobile h1 y=64 попадал под header. Новые 8 geometry
cases дали 8 FAIL на panel inset до product edits. Root cause — Hall вычитал
условные 5rem из высоты, но не резервировал реальное место над сценой.

**Owner/boundary:** shared CSS tokens задают row=5rem и header=row+1px; Header и
reading-progress потребляют их. Hall wrapper резервирует верх и существующие
mobile dock/audio budgets; один MobileDock ResizeObserver остаётся владельцем
измерения dock. Общая min-height сцены наследуется внутренним flex layout;
короткие экраны прокручиваются без сжатия текста. H3/R1/L0/UV0, camera, context-loss,
fallback, rights и медиа не изменены. Data migration нет. Rollback — этот CSS/UI/
QA diff с обычной регенерацией discovery fingerprints; нового engine нет.

**After:** 12/12 Hall tests PASS (8 geometry + прежние 4): actual SwiftShader WebGL,
forced fallback, настоящий context loss, camera controls, 1440×1000 / 390×844 /
320×568 / 768×1024, dark/light, reduced motion. Compact case проверяет доступность
кнопки после нормальной прокрутки; остальные — без неё. CPU regression suite
80/80 PASS. Визуальные WebGL PNG просмотрены desktop dark/mobile light: panel
теперь y=113/101, mobile h1 y=145, header hit-test исправлен, dock не закрывает
кнопки. Hall axe: 0 violations; incomplete aria-prohibited-attr=1 и contrast=6
в каждой пробе, не WCAG closure. 6 font faces loaded, 6/6 viewport images decoded,
0 console/page errors и failed requests. Observed CLS sum desktop 0.000933→0,
mobile 0→0; LCP 512→676 / 356→460 ms — одиночные software-rendered наблюдения,
не performance benchmark. Артефакты ignored `qa-artifacts/recheck-step/`.

Contracts/check/build/prerender/build-output PASS. Нативный Safari/manual AT,
реальная аудиосессия поверх Hall и production не сертифицированы локально.
Active-audio inset использует имеющийся height budget, не новое измерение.
Dependencies/CI/content не менялись; 31 discovery fingerprints regenerated.
PR остаётся draft/open. Production/AuditRepo closure не заявляется.

## Выполнение — 2026-10-15: шаг 7, подписи HeroPoetWindow

**Baseline:** clean `a677a1c`; source/build/prerender/budgets и contracts PASS на
том же product tree. Hall step budgets: entry 635190→635218 B, JS 1731641→1731696 B,
CSS 263083→263747 B. К моменту следующего commit 9 workflows Hall SUCCESS,
Manual Browser QA ещё in progress; Pages skipped. Это не преждевременный all-green.

**Подтверждение:** 4 browser probes (desktop/mobile × dark/light), snapshots и
computed paint показали, что generic `text-cyan-200/46` становится rgba(31,61,71,.66)
в light поверх неизменно тёмного gradient. Новые 4 QA cases учитывают оба gradient
stops, alpha текста/подложки, mobile opacity .96 и крайние чёрный/белый backdrop.
До исправления все 4 FAIL: dates contrast dark desktop/mobile 3.549/3.356, light
1.105/1.103. Это conservative backdrop tests, не измерение каждого пикселя фотографии.

**Один owner:** caption panel теперь использует существующий `theme-dark-island`,
имя — island-text, даты — island-muted. Новые цвета/override engine не добавлены.
Размеры, портреты, layout, gradient, hover/focus/motion и ссылки не изменены.
Все 6 подписей проверяются для клавиатуры и touch; 4 новых cases PASS ≥4.5.
В combined theme/reader/shell run: 39 PASS / 1 FAIL. Отдельно short-dark footer
scroll assertion упал после warm navigation; без source/test изменений 5 повторов
PASS. Этот непостоянный scroll failure **не исправлен** и не выдан за 40/40 PASS;
в failing run прокрутка целого footer не довела целевую ссылку до viewport.
Контракт reservation/CLS не падал. Логи сохранены для последующего исследования.

**Визуальная проверка:** before/after PNG, desktop keyboard focus и mobile dark/
light просмотрены. 6 hero images decoded, 6 font faces loaded, 0 page/console
errors и failed requests во всех четырёх пробах. Offscreen lazy images с
naturalWidth=0 не считаются broken viewport images. Axe: 0 violations, contrast
incompletes 2/2/12/12; отдельный paint test нужен именно потому, что axe не оценивает
эти gradients. After CLS sums 0.001508/0/0/0, LCP 384/668/264/260 ms; не speed score.
Размеры caption текста и 200% zoom/manual AT этим шагом не сертифицированы.

Contracts/check/build/prerender/budgets PASS; entry 635218→635218 B, JS
1731696→1731731 B, CSS 263747→263543 B. Sitemap/feed byte-stable. Runtime rollback —
три semantic classes и regression guard; migration нет. Dependencies, CI и
историческое содержание не менялись. Артефакты ignored `qa-artifacts/recheck-step/`.

## Выполнение — 2026-10-15: редакционные задания и QA scroll correction

`18030b8` добавил только `docs/research/EDITORIAL_NEXT_STEPS_2026-10-15.md`:
проверяемый доступ к документам Бениславской/Есенина, происхождение электронной
передачи дневника Симонова, briefs «два Пророка» / «Silentium!». Это предложения
на основании текущего каталога, не внешняя верификация и не новые публикации.

На `18030b8` финальный параллельный запуск CPU/SwiftShader дал 83/84 и 11/12:
short-dark footer assertion воспроизвёлся второй раз; WebGL desktop не вышел из
loading за прежние 20 s. Логи не удалены. После анализа изменено только действие
shell QA: прокручивать конкретную ссылку, а не её большой footer ancestor.
Сохранились reservation/CLS/DOM identity assertions и viewport assertion ссылки;
добавлен реальный click и проверка destination heading. Это коррекция harness,
не новый runtime fix. Увеличения timeout, retry, skip или ослабления порогов нет.

После коррекции: полный CPU suite **84/84 PASS 1.9m**, изолированный actual-GL
Hall **12/12 PASS 1.4m** без source/timeout изменений; short-dark **10/10 PASS 29s**.
Итого 96 различных cases + 10 repeats. Параллельную нагрузку браузеров не считаем
производительным эталоном; transient WebGL loading timeout не скрыт.
`npm run check` повторён PASS. Последние изменения только QA/docs, production
bundle идентичен `868ba47`. Source/build evidence шагов 6–7 остаётся применимым.
Среда проверена снова: Node 22.22.3, npm 10.9.8, Chromium 153.0.8010.0; CPU для
CSS и SwiftShader для actual WebGL, Pages-like preview на 0.0.0.0:4173.
Exact-head CI после push отражается в PR, не выводится из локального PASS.

## Выполнение — 2026-10-15: относительный размер подписей и reflow галереи

**Baseline:** clean `851ca94`, main по-прежнему `090ea18`. Contracts/check/build/
prerender/budgets PASS; браузер Chromium 153 и Pages-like preview перепроверены.
Все 10 запущенных exact-head workflows `851ca94` завершились SUCCESS, включая
Manual Browser QA 38653742711; Pages skipped. PR514 открыт/BEHIND с прежним
lockfile-only scope; #497 OPEN и по-прежнему требует настоящих human sessions.

**Причина / один owner:** HeroPoetWindow использовал 7–11px text и mobile
clamp(8px,2.25vw,9px); при root font 32px текст не увеличивался, а rem padding рос.
Галерея имела только viewport-based 3/6 columns. Новый caption contract — имя
0.75rem, даты 0.625rem, единый относительный padding; gallery container выбирает
1/2/3/6 колонок по доступной rem-ширине. Это CSS, без измерителей/ResizeObserver/
JS font fitting. 12/10px — локальное design floor, не «минимальный шрифт WCAG».
Обновлён responsive sizes hint; портреты, приоритет двух первых изображений,
post-load release остальных, dark-island colours и motion authority сохранены.

**Red→green:** 8 новых cases (320/390/768/1440 × 100/200% root text) FAIL→PASS.
Проверяются все имена/даты, scaling, line bounds, overflow и реальный переход по
ссылке. Это text-only resize fixture, НЕ native browser/pinch zoom certification.
Вместе с existing labels/media tests 11/11 PASS; actual-GL first-viewport polish
1/1 и focused hover/link/depth 1/1 PASS. Route/shell/theme/reader 84/84 PASS.

При расширении coverage старый hover в точку (12,18) попал вне округлой арки.
Ошибка отдельно воспроизведена на восстановленных **неизменённых product files
851ca94**, затем текущие edits безопасно восстановлены и rebuild выполнен.
Все три affected QA используют реальный центр hover; force/timeout/threshold
не добавлены. Успех opacity/depth/link assertions сохранён, hitbox не расширялся.

Before/after PNG просмотрены. 4 probes: desktop dark, mobile dark/light и mobile
200% text. Fonts=6, hero images=6 decoded; console/page/request errors=0.
Axe violations=0, contrast incompletes=2/12/12/12 (не WCAG closure). CLS sums
0.001508/0/0/0 не изменились; after LCP 348/248/264/288ms — наблюдения, не benchmark.
В 200% fixture обнаружена отдельная теснота MobileDock; она **не исправлена**
этим bounded gallery change. Whole-site text-resize/manual AT остаются открытыми.

Fresh budgets: entry 635218→635218 B; JS 1731731→1731817 B; CSS 263706→263833 B.
Все caps соблюдены. Один Home discovery fingerprint regenerated; feed стабилен.
Rollback — gallery/typography/sizes и QA diff, затем штатная генерация; данных
и новых изображений нет. Артефакты ignored `qa-artifacts/resize-step/`.

## Выполнение — 2026-10-15: Симонов, происхождение электронной передачи

На clean `430f4c4` essay validator: 10 essays, 0 errors, 1 warning — источник 6
без institution. Открыты выходные данные
https://militera.lib.ru/db/simonov_km/index.html и начало связанной главы 19.
Страница явно называет сайт «Военная литература», печатное издание М.:
Художественная литература, 1982 и OCR/HTML подготовку. Это проверенное основание
для metadata, не присвоение электронной библиотеке архивного статуса РГБ.

В canonical authoring source добавлены host/1982 и оговорка «OCR-передача,
не факсимиле»; год относится к печатной основе. Источник 1978 года НЭБ/РГБ
сохранён отдельно. IDs/URL/цитаты/исторический рассказ не менялись. Published
adapter обновляет dateModified на 2026-10-15; sitemap/feed/discovery пересобраны
штатно. Единственный owner остаётся canonical Essay publication boundary.

Новый browser guard RED→GREEN; вместе с catalog acceptance 2/2 PASS.
Check/contracts/build/prerender/budgets PASS. Essay validator 1→0 warnings;
прочие редакционные warnings не закрыты. Desktop dark/mobile light: metadata
есть в DOM и viewport, 6 fonts loaded, overflow=0, console/page/request errors=0.
PNG показали **отдельный старый contrast defect SourceLibrary**, особенно light
на тёмном gradient. Axe дал incomplete, а не сертификат читаемости; defect не
маскируется этим content change. JS/CSS budget не изменился от gallery step.
Rollback — source metadata/dateModified и штатная генерация. Rights не расширены.

**Уточнение security scope:** свежий npm audit всё ещё 5 affected package entries
(4 high, 1 moderate), но PR514 покрывает только fflate. Остальные: source-map-js
1.2.1 (доступен 1.2.2), braces 3.0.3 и его dependants micromatch/singlefile.
Latest braces=3.0.3; предложенный npm downgrade singlefile→0.9.0 не применён.
Это dev-tool chains, что само по себе не доказывает отсутствие риска.
Предыдущее обобщение «все 5 принадлежат PR514» неверно; lockfile не менялся.
Отдельный dependency change требует согласования по установленному протоколу.

## Выполнение — 2026-10-15: тематическая поверхность SourceLibrary

Причина: общий SourceLibrary сохранял фиксированный тёмный gradient, а light
палитра переводила текст в тёмные цвета. Один owner исправлен существующими
`theme-elevated-surface` / `theme-soft-surface`, functional text/control tokens
и общим keyboard outline; hash-target ring также использует theme variables.
Это все essay bibliography surfaces, не отдельный override для Симонова.
Контент, URLs, фильтрация, раскрытие и motion logic не изменены. Нового CSS,
зависимостей и CI-настроек нет. Rollback — component classes и новые guards.

4 новых browser cases RED→GREEN: Симонов (21 источник), Бениславская (13),
desktop dark 1440 и mobile light 390. Проверены текст ≥4.5:1, раскрытие/фильтр,
aria-pressed, keyboard outline ≥3:1 и hover. Fresh route/shell/theme/reader:
**88/88 PASS**, не сумма со старыми прогонами. Check/build/prerender/budgets PASS;
штатная discovery/feed/sitemap генерация не добавила diff. Entry 635218 B;
JS 1731817→1731594 B (−223), CSS 263833→263075 B (−758), caps соблюдены.

Оба after PNG действительно просмотрены: light bibliography читается на бумажной
поверхности, dark — на тёмной matte surface. Fonts=6, overflow=0, console/page/
request errors=0. Source-scoped axe violations=0; contrast incomplete 4→1,
дополнено computed-contrast guards, но НЕ whole-site AA/manual AT certification.
Артефакты ignored `qa-artifacts/sources-contrast-step/`. MobileDock 200% остаётся
отдельным открытым пунктом.

**Remote baseline RED не скрыт:** на `b693871abd789bb7a02b716d7cf647df325829fd`
run https://github.com/FedorMilovanov/TheLegendaryPoet/actions/runs/38657762835
прошёл publication boundary, затем 64-link audit дал один hard failure:
`ye1-yesenin-letter-to-blok-1915-museum`, `ERR network-failure`, URL с `www`.
Log прочитан через signed plain-text job resource после EOF прямой загрузки gh.
Тот же museum path без `www` отдельно открыт: заголовок «Блоку А.А., 9 марта
1915», полный текст письма на месте. WWW-fetch отдельно неуспешен (HTTP 500
fetch tool); это не доказывает конкретную DNS/TLS причину runner failure.
Исправление locator будет отдельным шагом с неизменённым 64-link gate.

## Выполнение — 2026-10-15: точный locator письма Есенина Блоку

Clean `755d72887f5d4e4d83423251997ed8431032cbe6`: полный `npm run check` и Part I
publication validator PASS. Remote RED предыдущего HEAD описан выше; не
замаскирован baseline PASS локальных content gates. Прямой shell egress не
используется как доказательство доступности 64 внешних сайтов.

Один canonical source URL исправлен с `www.museum-esenin.ru` на проверенный
`museum-esenin.ru`, path письма неизменён. Точное письмо открыто целиком: дата,
адресат, просьба о встрече «часа в 4» и подпись совпадают с locator/title.
ID, citation topology, kind=context, institution и оговорка «не второй отдельный
первичный документ» сохранены. Других музейных ссылок с этим host в src нет.
DateModified обновлён у существующего publishEssay adapter, не во втором owner;
sitemap/feed/discovery regenerated штатно. Рассказ, изображения и права не менялись.

В existing Part I browser guard добавлены exact href/title/source-hierarchy
assertions: намеренный RED на старом href → GREEN на исправленном. Полный case
сохранил 64 citation targets / 64 expanded cards / 64 external links, zero overflow
и broken images. Check/contracts/build/prerender/budgets/publication PASS.
Desktop dark 1440 и mobile light 390 screenshots просмотрены; музейная карточка
в viewport, fonts=6, overflow=0, console/page/request errors=0. Source-scoped axe
violations=0, contrast incomplete=1, не whole-site WCAG closure.

Rollback — один locator, publication date, guard и regenerated artifacts.
64-link verifier, retries, timeouts и CI не редактировались. Окончательная внешняя
доступность должна быть подтверждена новым exact-head CI; local browser href
assertion не подменяет HTTP GET музея. Evidence: ignored
`qa-artifacts/museum-locator-step/`, remote run IDs — в дополнении PR517.

## Выполнение — 2026-10-15: MobileDock, увеличение текста и читаемость

Baseline `02e8de16ffcbfe31ce4e37d56ff0d2205604ada0`: remote CI теперь 15 SUCCESS,
Pages SKIPPED, включая завершившийся Manual Browser QA. После восстановления
sandbox Git был на исходном commit, а session diff лежал в working tree. Все
734 пути побайтово сверены с remote HEAD; mixed reset восстановил только ref/index,
не содержимое файлов. Получен clean HEAD без повторных коммитов/потерь.
Fresh npm ci/check/build/prerender/budgets PASS до изменений.

**Причина / owner:** MobileDock flex row сохранял четыре min-content подписи,
но icon-only FAB тоже рос с rem. На root 32px край «Статьи» доходил до x≈471
при viewport 320/390, хотя root scrollWidth не показывал overflow. Shared dock
CSS теперь использует inline-size container и два ряда при недостатке rem-ширины;
FAB ограничен 44–54px, подписи остаются 0.6rem (9.6→19.2px), ни один пункт не
скрыт/не сокращён. При 100% сохраняется однорядный dock. Existing ResizeObserver
публикует фактическую высоту: нового JS/font fitting/измерителя не добавлено.

В том же owner обнаружен независимый contrast defect: translucent inactive text
давал worst-case 4.428 dark / 2.879 light. Применён существующий --tlp-text-muted,
удалён старый light override; glass surface, active pill и focus styles сохранены.
Новый paint-aware guard учитывает оба gradient stops, black/white backing и pill.

**RED→GREEN:** 4 geometry cases + 2 contrast cases. Geometry: 320/390 × dark/light,
100→200→100%, text bounds, все пять targets ≥44px, hit-testing, overlap, live
clearance, все четыре перехода/aria-current, Tab order, keyboard search и focus
return. Contrast: ≥4.5 для всех четырёх подписей при 100/200%.
Final route/shell/theme/reader/Part I **95/95 PASS**; existing mobile search/audio/
clearance **3/3 PASS** (Chromium Android emulation). Две дополнительные 320px/200%
audio probes после настоящего upward scroll: visible dock 180.25px, published
clearance 181px, mini-player gap 24.75px в обеих темах. Первый diagnostic tap
при auto-hidden/inert dock закономерно не прошёл; это не обходилось force/DOM class
removal — probe исправлен на реальный scroll и ожидание видимого dock/clearance.

Первый общий прогон был 88 PASS / 7 FAIL: использован Vite вместо штатного
`serve-pages-static.mjs` для initial alias/404 documents. Все 7 FAIL повторены с
неизменённым baseline CSS, затем 7 PASS на том же baseline с Pages server. После
возврата product CSS и rebuild полный прогон 95 PASS. Tests/CI/route contract не
ослаблялись. Preview использует ignored копию штатного server с единственной
заменой bind 127.0.0.1→0.0.0.0, не новый production engine.

До/после PNG реально просмотрены (обе темы, 320/390; также normal-size samples).
Fonts=6, broken images=0, overflow=0, console/page/request errors=0. Dock-only axe:
after violations=0, contrast incompletes=4 per 200% probe; supplemented gradient
contrast guard, НЕ whole-site WCAG. Loading CLS=0 во всех четырёх before/after
probes; LCP 312/280/316/296→280/280/284/312ms, локальные unthrottled наблюдения.
Check/contracts/build/prerender/budgets PASS; entry/JS прежние 635218/1731594 B,
CSS 263075→263403 B (+328), caps соблюдены. Discovery/feed/sitemap byte-stable.

Среда: Node22.22.3/npm10.9.8, Chromium153.0.8010.0; npm-distributed Chromium/NSS
и прежний sandbox-only NSS compatibility shim, CPU render. Бинарь/PNG/обвязка —
только ignored `qa-artifacts/dock-resize-step/`. Dependencies/CI/brand/rights не
менялись. Rollback — ограниченный dock CSS и новые QA cases. Native zoom, реальный
Safari/manual AT, whole-site 200% и остальные fixed chrome не сертифицированы.

## Продолжение — 2026-10-15: внешний CI RED и дневниковая запись РГАЛИ

На clean `6c21a7ee9b6bcc94615c341be94491df476c87ca` повторно проверен remote CI.
`Yesenin Part I safe publication`, run 38704490863, job 116320398877: publication
boundary SUCCESS, затем 64-link audit FAILURE. Plain-text job log прочитан через
fetch после EOF загрузки gh: один `ERR network-failure` у
`https://museum-esenin.ru/esenin/pisma/1915/bloku-a.a.-9-marta-1915`; остальные
63 URL приняты существующей политикой (200 либо restricted 403 у НЭБ).
Конкретная DNS/TLS/timeout причина по этому логу не установлена.

Точное письмо заново открыто внешним fetch, тело/дата/адресат на месте. Успех
предыдущего run на 02e8de1 и нынешний внешний fetch НЕ гарантируют доступность
с GitHub runner; прежняя замена www→bare не объявляется окончательным решением
сетевой стабильности. URL обратно не переключался, retries/timeouts/gates не
менялись. Попытка `gh run rerun --failed` не состоялась; прямой REST rerun-failed-jobs
вернул 403 `Resource not accessible by integration`, run_attempt остался 1.
Это запрет операции текущей интеграции, не доказательство поломанного workflow
(так сформулировал старый CLI). Пользователю сообщено: manual Re-run либо
переподключение GitHub с нужными правами. Rerun не заявляется выполненным.

Исследовательский шаг изолирован от runtime repair: открыта официальная строка
РГАЛИ ф.1604, оп.1, ед.хр.1123, «Г. А. Бениславская. Дневник», 35 листов,
28 августа [1919]–25 июля 1926. Путь через фонд Зелинского/опись/раздел сохранён
в `docs/research/BENISLAVSKAYA_DIARY_CATALOGUE_REVIEW_2026-10-15.md` вместе с
отсеянными похожими результатами и границами доказательства. Отдельный item URL
и изображения листов не получены; список не выдан за факсимиле. Canonical source,
исторические утверждения и права не менялись. Медицинские документы не закрыты.

Fresh clean baseline contracts PASS; essays 10/0/0, citations 10/0/11. Для этого
research-only шага повторяются те же validators и diff check, а не выдаётся
прошлый browser/build прогон за новый. Библиографические warnings не удаляются.
Remote RED сохраняется как отдельный незакрытый gate; новый docs commit не является
исправлением музейного endpoint или заменой запрещённого rerun.

## Продолжение — 2026-10-16: точная публикация расписки Аронсона

На `6bf5aaa` remote CI завершился: 15 SUCCESS, Pages SKIPPED, включая Manual
Browser QA. Старый музейный network-failure не повторился на этом HEAD;
сетевая стабильность этим не доказана, правила link gate не менялись.

В исследовательской копии Летописи т. 5, кн. 1 (2013) найден и визуально
сверен текст расписки: с. 580 / PDF 583; ГЛМ, ф. 4, оп. 1, ед. хр. 339
(Рнв 243/4, л. 1). SHA-256 совпал с existing ledger. Подробнее:
`research/ARONSON_RECEIPT_PUBLICATION_REVIEW_2026-10-16.md`.
Canonical source получил точную библиографию и границу печатная публикация ≠
факсимиле оригинала. Body/citations/URL/rights не менялись. На с. 595 гипотеза
о возвращении денег не превращена в факт. Две no-URL позиции остаются открытыми.

После возобновления sandbox HEAD оказался на исходном `090ea18`, а весь ранее
сохранённый diff — в working tree. Remote session branch оставалась `6bf5aaa`.
До записи проверено полное совпадение рабочего дерева с fetched tree через
temporary index. Локальный указатель/index восстановлены без hard reset,
перезаписи файлов, смены ветки или force push. Node22.22.3/npm10.9.8;
`npm ci`, clean baseline contracts/check/build/publication/citations PASS.

After contracts/check/essays/citations/Part II publication PASS:
10 essays, 0 errors/0 essay warnings, 11 citation warnings — без изменения.
Первый after check потребовал обновить discovery fingerprints после source note;
штатные sitemap/feed generators изменили ровно 3 fingerprint (Home, Articles,
Есенин II), URL/state/lastmod и feed/sitemap остались прежними. Gate не ослаблен.

Fresh browser before/after: Chromium153/NSS shim/CPU, desktop1440×1000 dark и
mobile390×844 dark/light, explicit isMobile/reduced-motion. Source-card 3/3 PASS:
новые библиографические поля видны, фиктивной ссылки нет, overflow=0, fonts=6;
after PNG всех трёх режимов и mobile dark before реально просмотрены.
Axe card: 0 violations, 1 color-contrast incomplete в каждом случае; не WCAG
certificate. LCP 392/292/276→384/320/296 ms; CLS 0.001158/0/0→без изменений.
Это локальные unthrottled probes на hash-route, не полная performance acceptance.

В каждой before/after пробе один failed request/console resource error и один
broken portrait: Wikimedia Special:Redirect/file/Сергей_Есенин_(1921).jpg,
ERR_CONNECTION_CLOSED. `skipped: sandbox egress`; не исправление сайта и не
all-images PASS. Других console/page/request errors и broken images в пробах нет.
Портрет не подменялся mock/локальным ассетом. Browser tools/shim/PNG — ignored,
project dependencies/CI неизменны. Vite preview accepts точный sandbox hostname
через environment, bind0.0.0.0; production config не редактировался.

Открыто: прямой публичный свидетель расписки, архивный оригинал, медицинский
документ ед.37, дневниковый лист1123; native Safari/manual AT/production и #497
этим шагом не закрываются. Новый HEAD требует собственного CI после push.

## Продолжение — 2026-10-16: опубликованное медицинское факсимиле

Clean baseline `75b0d58`: contracts/check/citations PASS; working tree clean.
В копии сборника ИМЛИ 2003 года повторно проверены SHA-256/416 страниц,
найдены и визуально просмотрены с.368 (описание ед.37: 5 декабря 1925, 2 листа)
и с.372–374 (три страницы факсимиле). Протокол:
`research/MEDICAL_DOCUMENT_PUBLICATION_REVIEW_2026-10-16.md`.
Архивный оригинал не изучен; две страницы публичного каталога ОР ИМЛИ не дали
item URL. Ед.47 (акт вскрытия) не подменяет ед.37. Медицинская интерпретация,
reader body, citations, права и обе no-URL позиции не менялись.
Canonical source note теперь содержит точные страницы и границу копия/оригинал.

Fresh after: contracts/check/build/prerender/SEO/budgets/Part II publication PASS;
essays10/0/0, citations10/0/11 (без изменения). Штатная генерация: 3 fingerprints,
feed/sitemap/URL/state/lastmod прежние. Никаких dependency/CI/validator изменений.
Browser before/after: 3/3 source-card probes, Chromium153/NSS shim, CPU,
desktop1440×1000 dark, mobile390×844 dark/light, reduce. Проверены новый текст,
отсутствие фиктивной ссылки, fonts6, overflow0; after PNG трёх режимов просмотрены.
Axe0 violations, 1 contrast incomplete/case. Final after LCP320/280/256ms,
CLS0.001158/0/0.000455; baseline488/296/260ms и CLS0.095087/0/0.
Это наблюдения, не доказательство performance improvement: загрузка внешнего
портрета непостоянна. Baseline Wikimedia ERR_CONNECTION_CLOSED в 2/3 проб,
final after в 2/3, промежуточный after в 3/3. Для этих проб broken image/console
resource error/request failure честно сохранены (`skipped: sandbox egress`);
других ошибок не найдено. Никакого mock изображения или all-images certificate.

Среда сохранена: Node22.22.3/npm10.9.8, browser и preview работают; PyMuPDF
установлен отдельно для исследования, package/lock не менялись. Полный PDF
не коммитится; источник остаётся в подключённом Drive. PR517 draft/open;
на 75b0d58 CI при последней проверке 7 SUCCESS, 4 IN_PROGRESS, 4 QUEUED,
Pages SKIPPED, не объявляется завершённым. Новый commit требует собственного CI.

## Продолжение — 2026-10-16: редакторский проход двух «Пророков»

После commit48a4b02 на clean HEAD повторены contracts/check/citations (PASS).
Заново открыты тексты Пушкина/Лермонтова РВБ, комментарий Лермонтова, iLibrary
и Ис.6 (оба fetch chunks). В черновике убраны недоказанное «возвращение в город»
и утверждение об отсутствии нового спора: текст даёт прохождение через город,
а ответ героя старцам не приводит. Библейский параллелизм уточнён без
приравнивания Ис.6 к сцене личного изгнания; убрана тавтология. В source review
добавлены контроль цитат, точная формулировка датировки и оставшиеся gates.
Это самопроверка, не independent editorial approval. Ни новых исторических
публикаций, ни library punctuation repair, ни runtime source registry.
Docs-only delta: browser/build предыдущего шага не выдаются за проверку новой
статьи; её нет в Essay/catalog/search/feed/sitemap. After contracts/essays/
citations и diff check повторяются; publication authority остаётся открытой.

## Продолжение — 2026-10-16: восстановление HEAD и полная сверка стихотворения

После восстановления среды локальный HEAD оказался 090ea18, а все изменения
сессии — в рабочем дереве. Fetch показал remote c45f8a8; staged snapshot
побайтово совпал с remote (git diff --cached --exit-code). Сохранён safety stash,
выполнен обычный fast-forward той же ветки на c45f8a8, без hard reset/force.
Clean baseline затем проверен заново; AGENTS/current state/contract/charter и
актуальная входная README AuditRepo прочитаны. npm ci восстановил зависимости;
Node22.22.3. CI c45f8a8 завершён: 15 SUCCESS, Pages SKIPPED, failures0.

Заново открыты полный текст РВБ, полный текст iLibrary и его библиографическая
карточка. Сверены все 28 стиховых строк canonical lermontov-2: 27 совпадают
с iLibrary, 24 с РВБ. Четыре позиции и точные знаки сохранены в
research/PROROK_LIBRARY_COLLATION_2026-10-16.md. Локальный программный подсчёт
использует ручную передачу прочитанных строк, не выдаётся за independent scrape.
Рекомендован отдельный минимальный patch нами; → нами: по iLibrary; runtime
в этом шаге не тронут. Номер печатной страницы не выдуман. Новое исследование
не обозначается независимой рецензией или разрешением на публикацию.

Clean baseline: contracts/check/library/citations PASS. After docs-only:
contracts/library/citations/diff-check PASS. Baseline warnings не удалены.
Browser/build заново не запускались: runtime/src/public/QA/scripts/package/CI
не изменены; предыдущие screenshots не выдаются за новый exact-head browser
proof. Внедрение библиотечной правки требует собственного браузерного шага.

## Продолжение — 2026-10-16: библиотечный знак и browser regression

Restored sandbox снова имел HEAD090ea18 и snapshot изменений. Staged snapshot
побайтово сверен с remote13c3da2, сохранён stash; та же ветка fast-forward,
без hard reset/force. Clean13c3da2: contracts/check/library/build PASS.
Прочитаны AGENTS/current state/contract/charter и current AuditRepo README.
npm ci, Node22.22.3; browser заново установлен только в ignored artifacts:
Chromium153.0.8010.0, NSS3.22 вместо required3.30 (version hash/string patch),
PK11_HasAttributeSet shim. Убран --single-process после context-close crash;
исходные неудачные browser attempts не считаются успешными пробами.

Root: canonical строка22 не совпадала ни с одной из двух проверенных передач.
Owner: src/data/library/mikhailLermontov.ts lermontov-2. Единственная runtime
замена нами; → нами: по iLibrary; остальные строки/ID/year/толкования прежние.
Существующий reader-text QA расширен тестом четырёх edition-sensitive строк,
числа28 и Selection equality. Rollback: этот знак, новый тест и четыре штатных
discovery fingerprints; никакого CI/dependency/validator weakening.

After: contracts/check/build/prerender/build-output/SEO PASS, новый Playwright
regression 1/1 PASS. Library0errors/1warning, citations0errors/11warnings, baseline
не менялся. Before/after probe3/3: 1440×1000dark,390×844dark/light, reduce.
Fonts7, overflow0, pageerrors0, consoleerrors0, failedrequests0, brokenimages0;
DOM и Selection равны canonical. Scoped axe0 violations/1contrast incomplete.
Baseline LCP1192/700/764ms, CLS0.001405/0/0; локальные unthrottled метрики,
performance improvement не заявляется. Final after JSON сохраняет свои метрики.

После просмотра первых selected-layer PNG выделение снято, after PNG всех
трёх режимов пересняты и действительно просмотрены. Наложение selected слоя,
узкая mobile колонка и fixed header в элементном desktop screenshot не
замаскированы как исправленные. Scope — пунктуация, не shared renderer repair;
подробности в collation review. NativeSafari/AT/systemclipboard не проверены.
Статья research, не в catalog/sitemap; права и medical residuals прежние.

## Продолжение — 2026-10-17: shared mobile poem reading width

Clean baseline c90f0b7 восстановлен из snapshot: staged tree побайтово совпал
с remote, safety stash и fast-forward той же ветки, без hard reset/force.
Прочитаны AGENTS/current-state/contract/charter/current AuditRepo entry.
Baseline contracts/check/build PASS; c90f0b7 CI завершён:15success/PagesSkipped.
Node22.22.3/npm ci, browser153/NSS version+hash shim восстановлены в ignored QA;
preview0.0.0.0:4173 разрешает e2b host. Project dependencies/CI не изменялись.

Root: shared PoemCard и InteractivePoemText оба расходовали по32px с каждой
стороны. В 390px viewport visual column226px, в320px156px. Дополнительный
mobile margin0.3em на каждом visual word поверх flex gap увеличивал переносы;
на320px screenshot обнаружил обрезанный финал. Не страничный Lermontov patch:
владельцы — два shared компонента, все `/poets/:id` poem cards. До sm:
card padding16 вместо32, reader padding/inset16 вместо32, margin слова0 вместо
0.3em (gap сохранён). От sm desktop/tablet прежние значения; canonical text,
ID, sources, dates, толкования, pointer dwell и presentation aria-hidden прежние.
Нет второго renderer/registry. Rollback ограничен этими responsive classes,
новым QA и этой записью. Shared renderer overlay/selection redesign не заявлен.

After contracts/check/build/prerender/build-output/SEO/diffcheck PASS.
Permanent browser QA: новый тест all mounted poems Lermontov/Yesenin при320/390,
minimum canonical+visual width, совпадение левого края и отсутствие обрезки
последних слов. Старые canonical selection и Prophet punctuation тесты вместе
с новым:3/3 PASS. Canonical text всех19 sampled before/after poem instances
побуквенно неизменен. Это 7 разных стихов, не все34 стихотворения каталога.

Before/after probes5/5: Lermontov desktop1440×1000dark,390×844dark/light,
320×740dark; Yesenin390×844dark; mobile/reduced-motion явно заданы. Visual widths
226→290px (390),156→220px (320),625.34375→625.34375px desktop. Fonts7, overflow0,
pageerrors0, consoleerrors0, failedrequests0. Scoped axe0violations,
color-contrast incomplete1/case — не WCAG certificate. Before LCP860/692/656/
668/692ms; after828/700/688/620/556ms; CLS after0.001366/0/0/0/0. Unthrottled
локальные измерения, не performance improvement. Final visual words внутри
карточек: max bottom delta отрицательная во всех5 пробах.

Наивный image probe отмечал not-complete/naturalWidth0 у1 lazy image на320
и4 на Yesenin (одинаково before/after). Отдельно проверены все8/12 изображений
обоих маршрутов: loading=eager + await decode,20/20 PASS, failures0. Поэтому
это deferred lazy loading, не доказанный broken asset или sandbox egress.
В основных JSON исходные наблюдения сохранены, не удалены ради зелёного.

Before mobile/320 и final after mobile/320/light PNG действительно просмотрены;
desktop PNG просмотрен до последней mobile-only margin правки. Переносы на
узком экране остаются допустимыми; fixed-header artefact element screenshot
и прежний transparent-selection overlay этим шагом не считаются исправленными.
NativeSafari/AT/systemclipboard/все10poets/zoom200% не проверены этим шагом.
Статья двух «Пророков» остаётся research; публикационные/правовые gates прежние.

## Продолжение — 2026-10-17: обязательная библейская оценка

Прямое уточнение владельца: статьи не нейтральные, библейские принципы должны
быть в repo. Они уже изложены в PROJECT_CHARTER, theological guidelines и
editorial/source policy; новый конфликтующий doctrinal SSOT не создаётся.
Root: входные инструкции недостаточно явно запрещали нейтрализацию, а финал
исследовательского «Пророка» ограничивал применение ответственностью за речь.
AGENTS/README получили прямое требование библейской оценки и ссылки на
существующих владельцев принципов. В theological guidelines добавлен §0:
различать факт, текст Писания, обоснованную оценку и жанровую границу. Запрет
механических вставок не означает необязательность оценки. Новая доктрина,
лишние публикационные поля или keyword validator не вводились.

Черновик получил содержательный финал по Ис.6:3–8, Иак.3:9–10,1Кор.15:3–4,
Мк.1:15: святость/вина/очищение, грех презрения к образу Божьему, смерть и
воскресение Христа и покаяние/вера. Ни веры/обращения двух поэтов, ни их
последнего часа из лирического героя не выводим. Прочитаны реальные тексты:
Ис.6 оба chunks, Иак.3 первый с3:1–18,1Кор.15 chunks0/1 с1–58, Мк.1 оба chunks.
Толкования хоста не заимствованы. Матрица применения добавлена в review;
это self-review, не независимое богословское одобрение.

Environment restoration: snapshot побайтово сверен с remote9bf62ff, safety
stash/fast-forward той же ветки, без hard reset/force. npm ci, Node22.22.3.
AGENTS/current-state/contract/charter/AuditRepo entry/authoring guide и текущие
editorial/theological standards прочитаны. Clean9bf62ff contracts/check PASS;
after contracts/check/essays/citations/diff PASS. Essays10/0errors/0warnings,
citations10/0errors/11warnings без изменения. Автоматические гейты проверяют
опубликованный корпус/контракты, не удостоверяют богословие research Markdown.

Runtime/src data/public/QA/workflows/dependencies не менялись, доктринальная
позиция не ослаблена. Browser/build не запускались в этом docs-only шаге;
черновик не публиковался в Essay/catalog/feed/sitemap. Rollback: новые абзацы
в правилах и research docs, без действия на reader routes. Открыты окончательная
редакционная рецензия и отдельные publication/browser gates будущей статьи.

## Продолжение — 2026-10-17: два «Пророка» в структуре Essay

Clean af14361 восстановлен через staged byte-match remote/safety stash/ff той
же ветки. AGENTS/current-state/contract/charter/theological/editorial/history
standards и AuditRepo entry прочитаны. Node22.22.3/npm ci. Baseline contracts/
check PASS. Отдельно CI af14361:14success/1failure/PagesSkipped. Failure — Manual
Browser QA run38982215282, browser-qa step12 «Run base iPhone Safari QA in fresh
browser processes». Check annotations дают лишь exit1; gh run log download
завершился EOF на results-receiver.actions.githubusercontent.com. Причина
конкретного iPhone assertion неизвестна, не объявлена network flake/pass;
workflows/tests существующего CI не ослаблялись и rerun не выдавался за ремонт.

Root/task: research prose ещё не имела typed Essay blocks и sourceIds.
Новый prorokDraft.ts использует существующий Essay с намеренно отсутствующими
publication date/cover (Omit), без новых моделей/registry/renderer. Перенос
6sections/22paragraphs/9sources, anchors уникальны, все sourceIds разрешаются,
readTime7 штатно вычислен. Библейский финал не заменён нейтральным пересказом.
Markdown объявлен frozen pre-transfer snapshot, дальнейший text owner — TS.
Четыре tsx/node tests проверяют изоляцию от каталога, источники, точный перенос
всех абзацев/ссылок и сохранение проверенного финала; не сертификат богословия.

After contracts/check/typecheck/build/prerender/build-output/SEO PASS; draft
suite4/4 PASS. Published essays10/0errors/0warnings, citations0errors/11warnings
baseline unchanged. Slug draft отсутствует во105 built text assets и public
essay payload; src/data/essays/index.ts,public/generated и routes без diff.
Browser не запускался: новой публичной статьи нет, её render/citations/mobile
не считаются проверенными. Источники заново в этом шаге не открывались; edition
и biblical review из предыдущих шагов не выданы за новую проверку.
Rollback — удалить draft+test и transfer annotations. Не добавлены обложка,
license/date/права/зависимости/CI. Окончательная editorial/publication/browser
проверка остаётся открытой; исходный CI failure также не закрыт этим переносом.
