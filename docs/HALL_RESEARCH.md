# Зал Поэтов — исторический research snapshot

> **SUPERSEDED / НЕ ТЕКУЩИЙ ПЛАН.** Этот файл сохраняет ход экспериментов Hall v2 и раннего Hall v3 на 12 июля 2026 года. Он не является архитектурным, визуальным или runtime-контрактом.
>
> Текущая authority: `docs/hall-v3/README.md` + `docs/hall-v3/hall-v3-contract.json` (`TLP-HALL-001`).
>
> В частности, ниже **устарели как текущие решения**: «temple v3» как единственная цель, фиксированные 4 крыла/эпохи, обязательный купол/статуи, старый N8AO/Bloom/Vignette look, предположение «достаточно включить USE_SCANS», blurred `hall-preview.webp` на `/hall` и идея переиспользовать Hall-v2 runtime как каркас. `public/images/hall-preview.webp` удалён из production delivery; `reference/hall_target_v3_temple.webp` остаётся только историческим concept reference. `src/components/hall/*` — forensic legacy evidence и исключён из текущего TypeScript/runtime ownership.

Ниже текст сохранён как **историческая запись принятых тогда гипотез и обнаруженных технических уроков**. Не реализовывать его как спецификацию без повторной проверки по текущему Hall-v3 contract.

---

## Исторический snapshot: референсы и исследование

Рабочие материалы по 3D/иммерсивному «Залу Поэтов», которые были зафиксированы между ранними итерациями.

### Тогдашний референс

- `reference/hall_target_v3_temple.webp` — ранний концепт «Храм Русской Поэзии»: купольная
  ротонда-пантеон с центральным атриумом и 4 крыльями по эпохам (Золотой век, Серебряный век,
  Советская поэзия, Современные поэты). Резной камень, статуи, роспись купола, кессонированный
  потолок. В июле он использовался как приблизительный ориентир по духу.

> Эта схема больше не является утверждённой целью. Новый Hall сначала проходит reference-bible
> и metric-greybox shootout; число галерей, купол и пространственная типология не зафиксированы.

### Тогдашний стек и технические решения

- React Three Fiber (R3F) v9 + three.js r0.184 + `@react-three/drei` v10 +
  `@react-three/postprocessing` v3 + `postprocessing` (pmndrs) использовались в Hall v2 prototype.
- Постпроцессинг Hall v2: N8AO → Bloom → Vignette, ACES Filmic tone mapping на рендерере.
  Это историческая реализация, не обязательный Hall-v3 grade.
- **Полезный технический урок:** React Router context не пробрасывается через `<Canvas>` —
  `useNavigate()` нельзя бездумно вызывать внутри Canvas-дерева; навигационное ownership нужно
  проектировать на DOM/runtime boundary.
- **Полезный технический урок:** Framer Motion `layoutId` не делает автоматический morph между
  DOM и WebGL framebuffer. Любой будущий portrait→detail transition должен быть спроектирован
  отдельно и не наследуется автоматически из Hall v2.

### Почему Hall v2 выглядел плоско/«космически»

В Hall-v2 source существовала заготовка `src/components/hall/materials.ts`, но реальные PBR-наборы
не были частью production assets, а `USE_SCANS = false`. Архитектура в основном опиралась на
простые `meshStandardMaterial`/runtime effects.

Старый вывод «достаточно положить PBR scans и включить `USE_SCANS = true`» **снят**. Текущий
Hall-v3 contract требует отдельного material/lighting/export spike: корректные color spaces,
UV strategy, физически правдоподобные материалы, выбранный static-light delivery и проверку
raw→optimized runtime asset. Материалы не должны исправлять слабую greybox-архитектуру.

### Историческая оценка temple-концепта

Тогда предполагалось, что купол + 4 крыла хорошо лягут на эпохи, а детализация потребует
Blender/PBR/готовых 3D assets. Этот вывод полезен только как запись гипотезы. Текущий процесс
специально сравнивает несколько пространственных greybox-кандидатов и не закрепляет temple
из-за уже потраченного на него времени.

## 12.07.2026 — найдена вторая, более развитая версия проекта

Пользователь прислал `rebuildinglegendarypoetreactproject_1.zip` — отдельная сборка того же
проекта (87 файлов), которая никогда не пушилась в GitHub. Историческое сравнение показало:

**У репозитория (GitHub) было сильнее:**
- более полный и проверенный контент;
- более развитые текущие backend/community contracts.

**У zip были отдельные идеи/компоненты:**
- `InteractivePoemText` был перенесён и подключён отдельно от Hall;
- дополнительные UI-компоненты оценивались поштучно;
- появились `epochColors.ts`, `poetConnections.ts`, `poetMuseumMeta.ts` и другая Hall-концепция
  с зонами по эпохам, созвездием, связями, timeline и tour/network modes.

Тогда был сделан вывод смешать идеи обеих версий в музейной эстетике. **Этот вывод больше не
является Hall-v3 спецификацией.** `poetConnections.ts` может позже стать семантическим источником
для отдельного relations mode после повторной проверки; `poetMuseumMeta.ts` и старые visual
archetypes/material/accent prescriptions не являются текущей art authority.

## 12.07.2026 — Hall был отложен

После визуального merge других частей проекта `/hall` был заменён лёгкой заглушкой, а старые
R3F-компоненты оставлены в дереве как каркас будущей пересборки.

На 8 августа 2026 эта формулировка уточнена и ужесточена: старый Hall **не является каркасом
нового runtime**. Он сохранён как forensic evidence, не импортируется production `/hall`,
исключён из текущего TypeScript contract и не должен копироваться wholesale. Текущий Hall-v3
строится только через gate sequence из `docs/hall-v3/README.md`.
