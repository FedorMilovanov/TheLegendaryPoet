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
