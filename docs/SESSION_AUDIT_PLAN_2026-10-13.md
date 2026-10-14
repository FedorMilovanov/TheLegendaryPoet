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
